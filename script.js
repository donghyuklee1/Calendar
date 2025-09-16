document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 가져오기
    const monthYearDisplay = document.getElementById('month-year');
    const datesContainer = document.getElementById('dates-container');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const timeline = document.getElementById('timeline');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const modal = document.getElementById('schedule-modal');
    const scheduleForm = document.getElementById('schedule-form');
    const cancelButton = document.getElementById('cancel-button');

    // 상태 변수
    let currentDate = new Date(2025, 8, 16);
    let schedules = {}; // { 'YYYY-MM-DD': [ { id, category, ... } ] } 형식으로 일정 저장

    // --- 모달 관련 함수 ---
    function openModal(date, hour) {
        scheduleForm.reset(); // 폼 초기화
        document.getElementById('schedule-start-time').value = `${String(hour).padStart(2, '0')}:00`;
        document.getElementById('schedule-end-time').value = `${String(hour + 1).padStart(2, '0')}:00`;
        modal.dataset.date = date; // 모달에 현재 날짜 저장
        modal.classList.add('visible');
    }

    function closeModal() {
        modal.classList.remove('visible');
    }

    // --- 캘린더 렌더링 관련 함수 ---
    function renderCalendar() {
        // ... (이전과 동일한 캘린더 렌더링 코드)
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

            const dayName = document.createElement('span');
            dayName.className = 'day-name';
            dayName.textContent = date.toLocaleDateString('ko-KR', { weekday: 'short' });
            
            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;

            dateItem.appendChild(dayName);
            dateItem.appendChild(dayNumber);
            datesContainer.appendChild(dateItem);

            if (day === currentDate.getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                 dateItem.classList.add('active');
            }
        }
        
        const firstDateItem = datesContainer.querySelector('.date-item');
        if (firstDateItem && !datesContainer.querySelector('.active')) {
             if (currentDate.getDate() === 1) firstDateItem.classList.add('active');
             else datesContainer.querySelector(`[data-date='${toYYYYMMDD(currentDate)}']`)?.classList.add('active');
        }

        addDateClickListeners();
        updateSchedulePanel();
        
        setTimeout(() => {
            const activeDateEl = datesContainer.querySelector('.active');
            if(activeDateEl) centerActiveDate(activeDateEl);
        }, 100);
    }

    function updateSchedulePanel() {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        selectedDateDisplay.textContent = currentDate.toLocaleDateString('ko-KR', options);
        renderTimeline(); // 날짜가 바뀌면 타임라인도 다시 렌더링
    }

    // ✨ [수정] 타임라인 렌더링 함수
    function renderTimeline() {
        timeline.innerHTML = '';
        const dateKey = toYYYYMMDD(currentDate);
        const dailySchedules = schedules[dateKey] || [];

        for (let hour = 8; hour <= 22; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            
            const timeLabel = document.createElement('span');
            timeLabel.className = 'time-label';
            timeLabel.textContent = `${hour}:00`;
            timeSlot.appendChild(timeLabel);

            // 해당 시간에 시작하는 일정이 있는지 확인
            const schedule = dailySchedules.find(s => parseInt(s.startTime.split(':')[0]) === hour);

            if (schedule) {
                // 일정이 있으면, 일정 아이템을 표시
                const eventItem = document.createElement('div');
                eventItem.className = 'event-item';
                eventItem.innerHTML = `<span class="category">${schedule.category}</span><span class="memo">${schedule.memo}</span>`;
                // (나중에 수정/삭제 기능을 위해) 클릭 이벤트 추가 가능
                timeSlot.appendChild(eventItem);
            } else {
                // 일정이 없으면, '새 일정 추가' 플레이스홀더 표시
                const eventPlaceholder = document.createElement('div');
                eventPlaceholder.className = 'event-placeholder';
                eventPlaceholder.textContent = '+ 새 일정 추가';
                eventPlaceholder.addEventListener('click', () => openModal(dateKey, hour));
                timeSlot.appendChild(eventPlaceholder);
            }
            timeline.appendChild(timeSlot);
        }
    }

    // --- 이벤트 핸들러 ---
    function handleScheduleSubmit(e) {
        e.preventDefault();
        const date = modal.dataset.date;
        const newSchedule = {
            id: Date.now(), // 간단한 고유 ID 생성
            category: document.getElementById('schedule-category').value,
            startTime: document.getElementById('schedule-start-time').value,
            endTime: document.getElementById('schedule-end-time').value,
            memo: document.getElementById('schedule-memo').value,
        };

        if (!schedules[date]) {
            schedules[date] = [];
        }
        schedules[date].push(newSchedule);
        schedules[date].sort((a, b) => a.startTime.localeCompare(b.startTime)); // 시간순 정렬

        closeModal();
        renderTimeline(); // 타임라인 새로고침
    }
    
    // ... (드래그 & 스와이프 기능 및 기타 헬퍼 함수들은 이전과 동일)
    
    function addDateClickListeners() { /* 이전과 동일 */ }
    function centerActiveDate(activeElement) { /* 이전과 동일 */ }
    function toYYYYMMDD(date) { return date.toISOString().split('T')[0]; }

    // --- 초기화 및 이벤트 리스너 등록 ---
    cancelButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
    scheduleForm.addEventListener('submit', handleScheduleSubmit);

    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

    // 드래그 & 스와이프 기능 (이전 코드 복사)
    let isDown = false, startX, scrollLeft, isDragging = false;
    const carousel = document.querySelector('.date-carousel');
    const startDrag = (e) => { isDown = true; isDragging = false; datesContainer.style.cursor = 'grabbing'; startX = (e.pageX || e.touches[0].pageX) - carousel.offsetLeft; scrollLeft = carousel.scrollLeft; };
    const endDrag = () => { isDown = false; datesContainer.style.cursor = 'grab'; setTimeout(() => isDragging = false, 50); };
    const doDrag = (e) => { if (!isDown) return; e.preventDefault(); isDragging = true; const x = (e.pageX || e.touches[0].pageX) - carousel.offsetLeft; const walk = (x - startX) * 2; carousel.scrollLeft = scrollLeft - walk; };
    carousel.addEventListener('mousedown', startDrag);
    carousel.addEventListener('mouseleave', endDrag);
    carousel.addEventListener('mouseup', endDrag);
    carousel.addEventListener('touchstart', startDrag);
    carousel.addEventListener('touchend', endDrag);
    carousel.addEventListener('touchmove', doDrag);
    
    // 초기 렌더링
    renderCalendar();


    // 캘린더 렌더링에 필요한 함수들 (이전 코드에서 가져와야 함)
    function addDateClickListeners() {
        document.querySelectorAll('.date-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if(isDragging) return;
                const currentActive = datesContainer.querySelector('.active');
                if (currentActive) currentActive.classList.remove('active');
                item.classList.add('active');
                currentDate = new Date(item.dataset.date);
                updateSchedulePanel();
                centerActiveDate(item);
            });
        });
    }

    function centerActiveDate(activeElement) {
        if (!activeElement) return;
        const scrollLeft = activeElement.offsetLeft - (carousel.offsetWidth / 2) + (activeElement.offsetWidth / 2);
        carousel.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
});
