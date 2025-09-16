document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소
    const monthYearDisplay = document.getElementById('month-year');
    const datesContainer = document.getElementById('dates-container');
    const carousel = document.querySelector('.date-carousel');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const timeline = document.getElementById('timeline');
    const timelineEvents = document.getElementById('timeline-events');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const modal = document.getElementById('schedule-modal');
    const scheduleForm = document.getElementById('schedule-form');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const cancelButton = document.getElementById('cancel-button');
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    const splashScreen = document.getElementById('splash-screen'); // ✨ [추가] 스플래시 스크린 요소

    // 상태 변수
    let currentDate = new Date();
    let schedules = JSON.parse(localStorage.getItem('schedules')) || {};
    let activeFilter = 'all';
    let isDragging = false;
    let lastFocusedElement;

    // 상수
    const HOUR_HEIGHT = 60;

    // --- 데이터 관리 ---
    function saveSchedules() {
        localStorage.setItem('schedules', JSON.stringify(schedules));
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

    function getSelectedTime(type) {const hourEl = document.getElementById(`${type}-hours`);const minuteEl = document.getElementById(`${type}-minutes`);const hour = Math.round(hourEl.scrollTop / 40);const minute = Math.round(minuteEl.scrollTop / 40) * 5;return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;}
    function setSelectedTime(type, time) {const [hour, minute] = time.split(':').map(Number);document.getElementById(`${type}-hours`).scrollTop = hour * 40;document.getElementById(`${type}-minutes`).scrollTop = Math.round(minute / 5) * 40;}

    // --- 모달 관련 (접근성 강화) ---
    function openModal(hour = null) {
        lastFocusedElement = document.activeElement;
        scheduleForm.reset();
        const dateKey = toYYYYMMDD(currentDate);
        let startHour = (hour !== null) ? hour : new Date().getHours();
        setSelectedTime('start', `${String(startHour).padStart(2, '0')}:00`);
        setSelectedTime('end', `${String(startHour + 1).padStart(2, '0')}:00`);
        modal.dataset.date = dateKey;
        modal.classList.add('visible');
        document.getElementById('schedule-category').focus();
    }
    
    function closeModal() {
        modal.classList.remove('visible');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
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
            if (toYYYYMMDD(date) === toYYYYMMDD(currentDate)) {
                dateItem.classList.add('active');
            }
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
            if (height < 20) height = 20;
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.style.top = `${top}px`;
            eventItem.style.height = `${height}px`;
            eventItem.innerHTML = `<div class="event-item-header"><span class="category">${schedule.category}</span><button class="delete-btn" data-id="${schedule.id}">&times;</button></div><span class="memo">${schedule.memo}</span>`;
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
    function handleScheduleSubmit(e) { /* 이전과 동일 */ }
    function handleDelete(e) { /* 이전과 동일 */ }
    function handleFilterClick(e) { /* 이전과 동일 */ }
    function handleModalKeydown(e) { /* 이전과 동일 */ }

    // --- 유틸리티 및 헬퍼 함수 ---
    function toYYYYMMDD(date) { return date.toISOString().split('T')[0]; }
    function addDateClickListeners() { /* 이전과 동일 */ }
    function setActiveDate(element) { /* 이전과 동일 */ }
    function smoothScrollTo(element, target, duration) { /* 이전과 동일 */ }
    function centerActiveDate(activeElement, behavior = 'smooth') { /* 이전과 동일 */ }
    function makeDraggable(element, options = { direction: 'horizontal' }) { /* 이전과 동일 */ }
    function snapToNearestDate() { /* 이전과 동일 */ }

    // --- 이벤트 리스너 등록 ---
    scheduleForm.addEventListener('submit', handleScheduleSubmit);
    cancelButton.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    timelineEvents.addEventListener('click', handleDelete);
    categoryFiltersContainer.addEventListener('click', handleFilterClick);
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderAll(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderAll(); });
    addScheduleBtn.addEventListener('click', () => openModal());
    modal.addEventListener('keydown', handleModalKeydown);

    // --- 초기 실행 ---
    populateTimeCarousels();
    makeDraggable(carousel, { direction: 'horizontal' });
    document.querySelectorAll('.time-carousel').forEach(tc => {
        makeDraggable(tc, { direction: 'vertical' });
    });
    // renderAll(); // ✨ 스플래시 화면 후에 호출되도록 변경

    // ✨ [추가] 스플래시 화면 제어
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.style.display = 'none'; // 완전히 사라진 후 DOM에서 제거 (선택 사항)
            renderAll(); // ✨ 스플래시 화면이 사라진 후 캘린더 렌더링 시작
        }, { once: true });
    }, 2000); // 2초 후 페이드 아웃 시작

    // ✨ 생략된 함수들의 전체 코드 (이전 답변과 동일)
    function getSelectedTime(type) {const hourEl = document.getElementById(`${type}-hours`);const minuteEl = document.getElementById(`${type}-minutes`);const hour = Math.round(hourEl.scrollTop / 40);const minute = Math.round(minuteEl.scrollTop / 40) * 5;return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;}
    function setSelectedTime(type, time) {const [hour, minute] = time.split(':').map(Number);document.getElementById(`${type}-hours`).scrollTop = hour * 40;document.getElementById(`${type}-minutes`).scrollTop = Math.round(minute / 5) * 40;}
    function handleScheduleSubmit(e) {e.preventDefault();const date = modal.dataset.date;const newSchedule = {id: Date.now(),category: document.getElementById('schedule-category').value || "#기타",startTime: getSelectedTime('start'),endTime: getSelectedTime('end'),memo: document.getElementById('schedule-memo').value,};if (newSchedule.startTime >= newSchedule.endTime) {alert('종료 시간은 시작 시간보다 늦어야 합니다.');return;}if (!schedules[date]) schedules[date] = [];schedules[date].push(newSchedule);schedules[date].sort((a, b) => a.startTime.localeCompare(b.startTime));saveSchedules();closeModal();renderTimeline();renderCategoryFilters();}
    function handleDelete(e) {if (!e.target.classList.contains('delete-btn')) return;if (!confirm('일정을 삭제하시겠습니까?')) return;const dateKey = toYYYYMMDD(currentDate);const scheduleId = Number(e.target.dataset.id);schedules[dateKey] = schedules[dateKey].filter(s => s.id !== scheduleId);saveSchedules();renderTimeline();renderCategoryFilters();}
    function handleFilterClick(e) {if (!e.target.classList.contains('filter-btn')) return;activeFilter = e.target.dataset.category;renderCategoryFilters();renderTimeline();}
    function handleModalKeydown(e) {if (e.key === 'Escape') {closeModal();return;}if (e.key === 'Tab') {const focusableElements = Array.from(modal.querySelectorAll('input, textarea, button'));const firstElement = focusableElements[0];const lastElement = focusableElements[focusableElements.length - 1];if (e.shiftKey) {if (document.activeElement === firstElement) {e.preventDefault();lastElement.focus();}} else {if (document.activeElement === lastElement) {e.preventDefault();firstElement.focus();}}}}
    function addDateClickListeners() {document.querySelectorAll('.date-item').forEach(item => {item.addEventListener('click', () => {if (isDragging) return;setActiveDate(item);});});}
    function setActiveDate(element) {const currentActive = datesContainer.querySelector('.active');if (currentActive) currentActive.classList.remove('active');element.classList.add('active');currentDate = new Date(element.dataset.date);updateUIForNewDate();centerActiveDate(element);}
    function smoothScrollTo(element, target, duration) {const start = element.scrollLeft;const change = target - start;let startTime = null;function animateScroll(currentTime) {if (startTime === null) startTime = currentTime;const elapsed = currentTime - startTime;const t = Math.min(elapsed / duration, 1);const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;element.scrollLeft = start + change * easedT;if (elapsed < duration) {requestAnimationFrame(animateScroll);}}requestAnimationFrame(animateScroll);}
    function centerActiveDate(activeElement, behavior = 'smooth') {if (!activeElement) return;const scrollLeft = activeElement.offsetLeft - (carousel.offsetWidth / 2) + (activeElement.offsetWidth / 2);if (behavior === 'smooth') {smoothScrollTo(carousel, scrollLeft, 400);} else {carousel.scrollLeft = scrollLeft;}}
    function makeDraggable(element, options = { direction: 'horizontal' }) {let isDown = false, startPos, scrollPos;const startDrag = (e) => {isDown = true;element.classList.add('active-drag');startPos = options.direction === 'horizontal' ? e.pageX - element.offsetLeft : e.pageY - element.offsetTop;scrollPos = options.direction === 'horizontal' ? element.scrollLeft : element.scrollTop;};const endDrag = (e) => {isDown = false;element.classList.remove('active-drag');if (options.direction === 'horizontal') {snapToNearestDate();}};const doDrag = (e) => {if (!isDown) return;e.preventDefault();isDragging = true;const pos = options.direction === 'horizontal' ? e.pageX - element.offsetLeft : e.pageY - element.offsetTop;const walk = (pos - startPos) * 1.5;if (options.direction === 'horizontal') {element.scrollLeft = scrollPos - walk;} else {element.scrollTop = scrollPos - walk;}};element.addEventListener('mousedown', startDrag);element.addEventListener('mouseleave', endDrag);element.addEventListener('mouseup', endDrag);element.addEventListener('mousemove', doDrag);element.addEventListener('touchstart', (e) => { startPos = e.touches[0].pageX - element.offsetLeft; scrollPos = element.scrollLeft; }, { passive: true });element.addEventListener('touchend', endDrag);}
    function snapToNearestDate() {if (!isDragging) return;setTimeout(() => isDragging = false, 50);const centerPoint = carousel.scrollLeft + carousel.offsetWidth / 2;let closestItem = null;let minDistance = Infinity;document.querySelectorAll('.date-item').forEach(item => {const itemCenter = item.offsetLeft + item.offsetWidth / 2;const distance = Math.abs(centerPoint - itemCenter);if (distance < minDistance) {minDistance = distance;closestItem = item;}});if (closestItem) {setActiveDate(closestItem);}}
});
