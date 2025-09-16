document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소
    const monthYearDisplay = document.getElementById('month-year');
    const datesContainer = document.getElementById('dates-container');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const timeline = document.getElementById('timeline');
    const timelineEvents = document.getElementById('timeline-events');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const modal = document.getElementById('schedule-modal');
    const scheduleForm = document.getElementById('schedule-form');
    
    // 상태 변수
    let currentDate = new Date();
    let schedules = JSON.parse(localStorage.getItem('schedules')) || {};
    let activeFilter = 'all';

    // 상수
    const HOUR_HEIGHT = 60; // CSS의 --timeline-hour-height와 동일해야 함

    // --- 데이터 관리 ---
    function saveSchedules() {
        localStorage.setItem('schedules', JSON.stringify(schedules));
    }

    // --- 시간 캐러셀 관련 ---
    function populateTimeCarousels() {
        const pickers = ['start', 'end'];
        pickers.forEach(type => {
            const hoursCarousel = document.getElementById(`${type}-hours`);
            const minutesCarousel = document.getElementById(`${type}-minutes`);
            hoursCarousel.innerHTML = '';
            minutesCarousel.innerHTML = '';

            for (let i = 0; i < 24; i++) {
                const item = document.createElement('div');
                item.className = 'time-item hour-item';
                item.textContent = String(i).padStart(2, '0');
                hoursCarousel.appendChild(item);
            }
            for (let i = 0; i < 60; i += 5) { // 5분 단위
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
    function openModal(date) {
        scheduleForm.reset();
        const now = new Date();
        const startHour = now.getHours();
        setSelectedTime('start', `${startHour}:00`);
        setSelectedTime('end', `${startHour + 1}:00`);
        modal.dataset.date = date;
        modal.classList.add('visible');
    }
    
    function closeModal() { modal.classList.remove('visible'); }

    // --- 렌더링 관련 ---
    function renderAll() {
        renderCalendar();
        renderTimeline();
        renderCategoryFilters();
    }

    function renderCalendar() {
        // ... (이전과 동일)
    }

    function renderTimeline() {
        timeline.innerHTML = '';
        timelineEvents.innerHTML = '';
        
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.innerHTML = `<div class="time-label">${hour}:00</div><div class="time-slot-placeholder"></div>`;
            timeline.appendChild(timeSlot);
        }

        const dateKey = toYYYYMMDD(currentDate);
        const dailySchedules = schedules[dateKey] || [];
        
        const filteredSchedules = activeFilter === 'all' 
            ? dailySchedules 
            : dailySchedules.filter(s => s.category === activeFilter);

        filteredSchedules.forEach(schedule => {
            const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
            const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
            
            const top = (startHour * HOUR_HEIGHT) + (startMinute / 60 * HOUR_HEIGHT);
            const endTop = (endHour * HOUR_HEIGHT) + (endMinute / 60 * HOUR_HEIGHT);
            const height = endTop - top;

            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.style.top = `${top}px`;
            eventItem.style.height = `${height}px`;
            
            eventItem.innerHTML = `
                <div class="event-item-header">
                    <span class="category">${schedule.category}</span>
                    <button class="delete-btn" data-id="${schedule.id}">&times;</button>
                </div>
                <span class="memo">${schedule.memo}</span>
            `;
            timelineEvents.appendChild(eventItem);
        });
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
        const date = modal.dataset.date;
        const newSchedule = {
            id: Date.now(),
            category: document.getElementById('schedule-category').value,
            startTime: getSelectedTime('start'),
            endTime: getSelectedTime('end'),
            memo: document.getElementById('schedule-memo').value,
        };
        if (!schedules[date]) schedules[date] = [];
        schedules[date].push(newSchedule);
        schedules[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        saveSchedules();
        closeModal();
        renderTimeline();
        renderCategoryFilters();
    }

    function handleDelete(e) {
        if (!e.target.classList.contains('delete-btn')) return;
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
    
    // --- 유틸리티 및 초기화 ---
    function toYYYYMMDD(date) { return date.toISOString().split('T')[0]; }

    // 여기에 이전 단계의 캘린더 관련 JS 함수들을 붙여넣습니다.
    // renderCalendar, addDateClickListeners, centerActiveDate 등...
    
    // --- 이벤트 리스너 등록 ---
    scheduleForm.addEventListener('submit', handleScheduleSubmit);
    document.getElementById('cancel-button').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    timelineEvents.addEventListener('click', handleDelete);
    categoryFiltersContainer.addEventListener('click', handleFilterClick);
    document.getElementById('prev-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderAll(); });
    document.getElementById('next-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderAll(); });
    // 드래그 기능...

    // 초기 실행
    populateTimeCarousels();
    renderAll();
});
