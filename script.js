document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소
    const splashScreen = document.getElementById('splash-screen');
    const monthYearDisplay = document.getElementById('month-year');
    const datesContainer = document.getElementById('dates-container');
    const carousel = document.querySelector('.date-carousel');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const timeline = document.getElementById('timeline');
    const timelineEvents = document.getElementById('timeline-events');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const scheduleModal = document.getElementById('schedule-modal');
    const detailsModal = document.getElementById('details-modal');
    const scheduleForm = document.getElementById('schedule-form');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const cancelButton = document.getElementById('cancel-button');
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    const closeDetailsBtn = document.getElementById('close-details-btn');

    // 상태 변수
    let currentDate = new Date();
    let schedules = JSON.parse(localStorage.getItem('schedules')) || {};
    let categoryColors = JSON.parse(localStorage.getItem('categoryColors')) || {};
    let activeFilter = 'all';
    let isDragging = false;
    let lastFocusedElement;

    // 상수
    const HOUR_HEIGHT = 60;
    const eventColors = [ { hex: '#FFFFFF', rgb: '255, 255, 255' }, { hex: '#84cc16', rgb: '132, 204, 22' }, { hex: '#38bdf8', rgb: '56, 189, 248' }, { hex: '#f97316', rgb: '249, 115, 22' }, { hex: '#a855f7', rgb: '168, 85, 247' }, { hex: '#ec4899', rgb: '236, 72, 153' } ];

    // --- 데이터 관리 ---
    function saveSchedules() { localStorage.setItem('schedules', JSON.stringify(schedules)); }
    function saveCategoryColors() { localStorage.setItem('categoryColors', JSON.stringify(categoryColors)); }

    function getCategoryColor(category) {
        if (categoryColors[category]) return categoryColors[category];
        const nextColorIndex = Object.keys(categoryColors).length % eventColors.length;
        const newColor = eventColors[nextColorIndex];
        categoryColors[category] = newColor;
        saveCategoryColors();
        return newColor;
    }

    // --- 시간 캐러셀 관련 ---
    function populateTimeCarousels() {
        ['start', 'end'].forEach(type => {
            const hoursCarousel = document.getElementById(`${type}-hours`);
            const minutesCarousel = document.getElementById(`${type}-minutes`);
            hoursCarousel.innerHTML = ''; minutesCarousel.innerHTML = '';
            for (let i = 0; i < 24; i++) {
                const item = document.createElement('div');
                item.className = 'time-item hour-item';
                item.textContent = String(i).padStart(2, '0');
                hoursCarousel.appendChild(item);
            }
            for (let i = 0; i < 60; i += 5) {
                const item = document.createElement('div');
                item.className = 'time-item minute-item';
                item.textContent = String(i).padStart(2, '0');
                minutesCarousel.appendChild(item);
            }
        });
    }

    function getSelectedTime(type) {
        const hourEl = document.getElementById(`${type}-hours`);
        const minuteEl = document.getElementById(`${type}-minutes`);
        const hour = Math.round(hourEl.scrollTop / 40);
        const minute = Math.round(minuteEl.scrollTop / 40) * 5;
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }

    function setSelectedTime(type, time) {
        const [hour, minute] = time.split(':').map(Number);
        document.getElementById(`${type}-hours`).scrollTop = hour * 40;
        document.getElementById(`${type}-minutes`).scrollTop = Math.round(minute / 5) * 40;
    }

    // --- 모달 관련 ---
    function openModal(hour = null) {
        lastFocusedElement = document.activeElement;
        scheduleForm.reset();
        const dateKey = toYYYYMMDD(currentDate);
        let startHour = (hour !== null) ? hour : new Date().getHours();
        setSelectedTime('start', `${String(startHour).padStart(2, '0')}:00`);
        setSelectedTime('end', `${String(startHour + 1).padStart(2, '0')}:00`);
        scheduleModal.dataset.date = dateKey;
        scheduleModal.classList.add('visible');
        document.getElementById('schedule-category').focus();
    }
    
    function closeModal(modalElement) {
        modalElement.classList.remove('visible');
        if (lastFocusedElement) lastFocusedElement.focus();
    }
    
    function openDetailsModal(schedule) {
        lastFocusedElement = document.activeElement;
        const color = getCategoryColor(schedule.category);
        document.getElementById('details-header').style.borderColor = color.hex;
        document.getElementById('details-modal-title').textContent = schedule.category;
        document.getElementById('details-time').textContent = `${schedule.startTime} - ${schedule.endTime}`;
        const locationEl = document.getElementById('details-location');
        locationEl.textContent = schedule.location || '위치 정보 없음';
        locationEl.style.display = schedule.location ? 'flex' : 'none';
        const memoEl = document.getElementById('details-memo');
        memoEl.textContent = schedule.memo || '메모 없음';
        memoEl.style.display = schedule.memo ? 'flex' : 'none';
        detailsModal.classList.add('visible');
        closeDetailsBtn.focus();
    }

    // --- UI 렌더링 ---
    function renderAll() {
        updateSchedulePanelHeader();
        renderCalendar();
        renderTimeline();
        renderCategoryFilters();
    }
    
    function updateUIForNewDate() {
        updateSchedulePanelHeader();
        renderTimeline();
        renderCategoryFilters();
    }

    function updateSchedulePanelHeader() {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        selectedDateDisplay.textContent = currentDate.toLocaleDateString('ko-KR', options);
    }

    function renderCalendar() {
        datesContainer.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearDisplay.textContent = `${year}년 ${month + 1}월`;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateItem = document.createElement('div');
            dateItem.className = 'date-item';
            dateItem.dataset.date = toYYYYMMDD(date);
            dateItem.innerHTML = `<span class="day-name">${date.toLocaleDateString('ko-KR', { weekday: 'short' })}</span><span class="day-number">${day}</span>`;
            if (toYYYYMMDD(date) === toYYYYMMDD(currentDate)) dateItem.classList.add('active');
            datesContainer.appendChild(dateItem);
        }
        addDateClickListeners();
        setTimeout(() => {
            const activeDateEl = datesContainer.querySelector('.active');
            if(activeDateEl) centerActiveDate(activeDateEl, 'auto');
        }, 100);
    }

    function renderTimeline() {
        timeline.innerHTML = '';
        timelineEvents.innerHTML = '';
        const timelineContainer = document.querySelector('.timeline-container');
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.innerHTML = `<div class="time-label">${hour}:00</div><div class="time-slot-placeholder"></div>`;
            timeSlot.addEventListener('click', () => openModal(hour));
            timeline.appendChild(timeSlot);
        }
        const dateKey = toYYYYMMDD(currentDate);
        const dailySchedules = schedules[dateKey] || [];
        const filteredSchedules = activeFilter === 'all' ? dailySchedules : dailySchedules.filter(s => s.category === activeFilter);
        filteredSchedules.forEach(schedule => {
            const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
            const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
            const top = (startHour * HOUR_HEIGHT) + (startMinute / 60 * HOUR_HEIGHT);
            const endTop = (endHour * HOUR_HEIGHT) + (endMinute / 60 * HOUR_HEIGHT);
            let height = endTop - top;
            if (height < 25) height = 25;
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.dataset.id = schedule.id;
            eventItem.style.top = `${top}px`;
            eventItem.style.height = `${height}px`;
            const color = getCategoryColor(schedule.category);
            eventItem.style.setProperty('--event-color', color.hex);
            eventItem.style.setProperty('--event-rgb-color', color.rgb);
            const locationHTML = schedule.location ? `<span class="location">📍 ${schedule.location}</span>` : '';
            eventItem.innerHTML = `<div class="event-item-header"><span class="category">${schedule.category}</span><button class="delete-btn" data-id="${schedule.id}">&times;</button></div><span class="memo">${schedule.memo}</span>${locationHTML}`;
            timelineEvents.appendChild(eventItem);
        });
        timelineContainer.scrollTop = 8 * HOUR_HEIGHT;
    }

    function renderCategoryFilters() {
        categoryFiltersContainer.innerHTML = '';
        const allCategories = new Set(Object.values(schedules).flat().map(s => s.category));
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn' + (activeFilter === 'all' ? ' active' : '');
        allBtn.textContent = '전체';
        allBtn.dataset.category = 'all';
        categoryFiltersContainer.appendChild(allBtn);
        allCategories.forEach(category => {
            if (!category) return;
            const btn = document.createElement('button');
            btn.className = 'filter-btn' + (activeFilter === category ? ' active' : '');
            btn.textContent = category;
            btn.dataset.category = category;
            categoryFiltersContainer.appendChild(btn);
        });
    }

    // --- 이벤트 핸들러 ---
    function handleScheduleSubmit(e) {
        e.preventDefault();
        const date = scheduleModal.dataset.date;
        const category = document.getElementById('schedule-category').value || "#기타";
        const newSchedule = {
            id: Date.now(),
            category: category,
            location: document.getElementById('schedule-location').value,
            startTime: getSelectedTime('start'),
            endTime: getSelectedTime('end'),
            memo: document.getElementById('schedule-memo').value
        };
        if (newSchedule.startTime >= newSchedule.endTime) {
            alert('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }
        if (!schedules[date]) schedules[date] = [];
        schedules[date].push(newSchedule);
        schedules[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
        saveSchedules();
        closeModal(scheduleModal);
        renderTimeline();
        renderCategoryFilters();
    }

    function handleDelete(e) {
        if (!e.target.classList.contains('delete-btn')) return;
        if (!confirm('일정을 삭제하시겠습니까?')) return;
        const dateKey = toYYYYMMDD(currentDate);
        const scheduleId = Number(e.target.dataset.id);
        schedules[dateKey] = schedules[dateKey].filter(s => s.id !== scheduleId);
        saveSchedules();
        renderTimeline();
        renderCategoryFilters();
    }
    
    function handleFilterClick(e) {
        if (!e.target.classList.contains('filter-btn')) return;
        activeFilter = e.target.dataset.category;
        renderCategoryFilters();
        renderTimeline();
    }

    function handleEventClick(e) {
        const eventItem = e.target.closest('.event-item');
        if (!eventItem || e.target.classList.contains('delete-btn')) return;
        const scheduleId = Number(eventItem.dataset.id);
        const dateKey = toYYYYMMDD(currentDate);
        const schedule = schedules[dateKey]?.find(s => s.id === scheduleId);
        if (schedule) openDetailsModal(schedule);
    }
    
    function handleModalKeydown(modalElement, e) {
        if (e.key === 'Escape') closeModal(modalElement);
        if (e.key === 'Tab') {
            const focusableElements = Array.from(modalElement.querySelectorAll('input, textarea, button'));
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === firstElement) { e.preventDefault(); lastElement.focus(); }
            } else {
                if (document.activeElement === lastElement) { e.preventDefault(); firstElement.focus(); }
            }
        }
    }

    // --- 유틸리티 및 헬퍼 함수 ---
    function toYYYYMMDD(date) { return date.toISOString().split('T')[0]; }
    
    function addDateClickListeners() {
        document.querySelectorAll('.date-item').forEach(item => {
            item.addEventListener('click', () => { if (isDragging) return; setActiveDate(item); });
        });
    }

    function setActiveDate(element) {
        const currentActive = datesContainer.querySelector('.active');
        if (currentActive) currentActive.classList.remove('active');
        element.classList.add('active');
        currentDate = new Date(element.dataset.date);
        updateUIForNewDate();
        centerActiveDate(element);
    }

    function smoothScrollTo(element, target, duration) {
        const start = element.scrollLeft;
        const change = target - start;
        let startTime = null;
        function animateScroll(currentTime) {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / duration, 1);
            const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            element.scrollLeft = start + change * easedT;
            if (elapsed < duration) requestAnimationFrame(animateScroll);
        }
        requestAnimationFrame(animateScroll);
    }
    
    function centerActiveDate(activeElement, behavior = 'smooth') {
        if (!activeElement) return;
        const scrollLeft = activeElement.offsetLeft - (carousel.offsetWidth / 2) + (activeElement.offsetWidth / 2);
        if (behavior === 'smooth') { smoothScrollTo(carousel, scrollLeft, 400); } 
        else { carousel.scrollLeft = scrollLeft; }
    }

    function makeDraggable(element, options = { direction: 'horizontal' }) {
        let isDown = false, startPos, scrollPos;
        const startDrag = (e) => {
            isDown = true;
            element.classList.add('active-drag');
            startPos = options.direction === 'horizontal' ? e.pageX - element.offsetLeft : e.pageY - element.offsetTop;
            scrollPos = options.direction === 'horizontal' ? element.scrollLeft : element.scrollTop;
        };
        const endDrag = () => {
            isDown = false;
            element.classList.remove('active-drag');
            if (options.direction === 'horizontal') snapToNearestDate();
        };
        const doDrag = (e) => {
            if (!isDown) return;
            e.preventDefault();
            isDragging = true;
            const pos = options.direction === 'horizontal' ? e.pageX - element.offsetLeft : e.pageY - element.offsetTop;
            const walk = (pos - startPos) * 1.5;
            if (options.direction === 'horizontal') { element.scrollLeft = scrollPos - walk; } 
            else { element.scrollTop = scrollPos - walk; }
        };
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('mouseleave', endDrag);
        element.addEventListener('mouseup', endDrag);
        element.addEventListener('mousemove', doDrag);
        element.addEventListener('touchstart', (e) => { startPos = e.touches[0].pageX - element.offsetLeft; scrollPos = element.scrollLeft; }, { passive: true });
        element.addEventListener('touchend', endDrag);
    }
    
    function snapToNearestDate() {
        if (!isDragging) return;
        setTimeout(() => isDragging = false, 50);
        const centerPoint = carousel.scrollLeft + carousel.offsetWidth / 2;
        let closestItem = null;
        let minDistance = Infinity;
        document.querySelectorAll('.date-item').forEach(item => {
            const itemCenter = item.offsetLeft + item.offsetWidth / 2;
            const distance = Math.abs(centerPoint - itemCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestItem = item;
            }
        });
        if (closestItem) setActiveDate(closestItem);
    }

    // --- 이벤트 리스너 등록 ---
    scheduleForm.addEventListener('submit', handleScheduleSubmit);
    cancelButton.addEventListener('click', () => closeModal(scheduleModal));
    scheduleModal.addEventListener('click', e => { if (e.target === scheduleModal) closeModal(scheduleModal); });
    timelineEvents.addEventListener('click', handleEventClick);
    closeDetailsBtn.addEventListener('click', () => closeModal(detailsModal));
    detailsModal.addEventListener('click', e => { if (e.target === detailsModal) closeModal(detailsModal); });
    categoryFiltersContainer.addEventListener('click', handleFilterClick);
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderAll(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderAll(); });
    addScheduleBtn.addEventListener('click', () => openModal());
    scheduleModal.addEventListener('keydown', (e) => handleModalKeydown(scheduleModal, e));
    detailsModal.addEventListener('keydown', (e) => handleModalKeydown(detailsModal, e));
    
    // --- 초기 실행 ---
    populateTimeCarousels();
    makeDraggable(carousel, { direction: 'horizontal' });
    document.querySelectorAll('.time-carousel').forEach(tc => {
        makeDraggable(tc, { direction: 'vertical' });
    });
    
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        splashScreen.addEventListener('transitionend', () => {
            renderAll(); 
        }, { once: true });
    }, 1500);
});
