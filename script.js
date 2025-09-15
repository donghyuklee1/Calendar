document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 상태 변수 및 데이터 저장소 ---
    const monthYearEl = document.getElementById('current-month-year');
    const carouselEl = document.getElementById('date-carousel');
    const scheduleListEl = document.getElementById('schedule-list');
    const modal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-title');
    const eventInput = document.getElementById('event-input');
    const saveEventBtn = document.getElementById('save-event-btn');
    const cancelEventBtn = document.getElementById('cancel-event-btn');

    let currentDate = new Date();
    let isDragging = false, startX, currentTranslate = 0;
    
    // 일정을 저장할 객체 (데이터베이스 역할)
    // 형식: { "YYYY-MM-DD": { "HH:MM": "일정 내용" } }
    let scheduleData = {
        "2025-09-15": { "14:00": "팀 프로젝트 회의" },
        "2025-09-17": { "10:00": "디자인 시안 작업", "19:00": "친구와 저녁 약속"}
    };
    
    // 모달 상태 관리를 위한 변수
    let selectedTimeSlot = null;

    // --- 2. 렌더링 함수들 (화면을 그리는 역할) ---
    const renderAll = () => {
        renderMonth();
        renderDateCarousel();
        renderSchedule();
    };

    const renderMonth = () => {
        monthYearEl.textContent = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
    };

    const renderDateCarousel = () => {
        carouselEl.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 현재 월의 이전, 현재, 다음 날짜들을 생성하여 무한 스크롤처럼 보이게 함
        const dateRange = getDateRange(year, month);
        dateRange.forEach(date => {
            const dayItem = createDayItem(date);
            carouselEl.appendChild(dayItem);
        });
        
        // 현재 날짜로 캐러셀 위치 조정
        const initialIndex = dateRange.findIndex(d => d.toDateString() === currentDate.toDateString());
        snapToIndex(initialIndex, 'auto');
    };

    const renderSchedule = () => {
        scheduleListEl.innerHTML = '';
        const dateKey = formatDate(currentDate);
        const dayEvents = scheduleData[dateKey] || {};

        for (let hour = 9; hour <= 18; hour++) {
            const time = `${String(hour).padStart(2, '0')}:00`;
            const eventText = dayEvents[time] || '';
            const timeSlot = createTimeSlot(time, eventText);
            scheduleListEl.appendChild(timeSlot);
        }
    };
    
    // --- 3. 헬퍼 함수들 (작업을 도와주는 작은 함수들) ---
    const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // 캐러셀에 표시할 날짜 배열 생성
    const getDateRange = (year, month) => {
        let dates = [];
        // 이전 달의 마지막 15일
        for(let i = 15; i > 0; i--) dates.push(new Date(year, month, 1 - i));
        // 현재 달의 모든 날
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for(let i = 1; i <= daysInMonth; i++) dates.push(new Date(year, month, i));
        // 다음 달의 첫 15일
        for(let i = 1; i <= 15; i++) dates.push(new Date(year, month + 1, i));
        return dates;
    };
    
    // 날짜 아이템 DOM 요소 생성
    const createDayItem = (date) => {
        const dayItem = document.createElement('div');
        dayItem.className = 'day-item';
        dayItem.dataset.dateString = date.toISOString();
        dayItem.innerHTML = `<div class="day-number">${date.getDate()}</div><div class="day-name">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]}</div>`;
        return dayItem;
    };
    
    // 시간 슬롯 DOM 요소 생성 및 이벤트 리스너 추가
    const createTimeSlot = (time, eventText) => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.dataset.time = time;
        timeSlot.innerHTML = `<span class="time">${time}</span><span class="event">${eventText}</span>`;
        timeSlot.addEventListener('click', () => openEventModal(time, eventText));
        return timeSlot;
    };
    
    // --- 4. 이벤트 핸들러 및 로직 ---
    // 모달 열기
    const openEventModal = (time, text) => {
        selectedTimeSlot = time;
        modalTitle.textContent = `${currentDate.getDate()}일 ${time} 일정`;
        eventInput.value = text;
        modal.classList.add('visible');
        eventInput.focus();
    };
    
    // 모달 닫기
    const closeEventModal = () => modal.classList.remove('visible');
    
    // 일정 저장
    saveEventBtn.addEventListener('click', () => {
        const dateKey = formatDate(currentDate);
        if (!scheduleData[dateKey]) {
            scheduleData[dateKey] = {};
        }
        scheduleData[dateKey][selectedTimeSlot] = eventInput.value;
        closeEventModal();
        renderSchedule(); // 스케줄 다시 렌더링하여 변경사항 반영
    });
    
    cancelEventBtn.addEventListener('click', closeEventModal);

    // --- 5. 캐러셀 인터랙션 로직 ---
    const itemWidth = 80;
    const snapToIndex = (index, behavior = 'smooth') => {
        const screenCenter = carouselEl.parentElement.offsetWidth / 2;
        targetTranslate = screenCenter - (index * itemWidth + itemWidth / 2);
        carouselEl.style.transition = behavior === 'smooth' ? 'transform 0.3s ease-out' : 'none';
        carouselEl.style.transform = `translateX(${targetTranslate}px)`;
        currentTranslate = targetTranslate;
        updateActiveDate(index);
    };

    const updateActiveDate = (activeIndex) => {
        const allItems = document.querySelectorAll('.day-item');
        let newSelectedDate = null;

        allItems.forEach((item, index) => {
            const distance = Math.abs(activeIndex - index);
            item.classList.remove('active', 'near');
            if (distance === 0) {
                item.classList.add('active');
                newSelectedDate = new Date(item.dataset.dateString);
            } else if (distance === 1) {
                item.classList.add('near');
            }
        });

        if (newSelectedDate && currentDate.toDateString() !== newSelectedDate.toDateString()) {
            currentDate = newSelectedDate;
            renderAll(); // 날짜가 바뀌었으면 월, 캐러셀, 스케줄 모두 다시 렌더링
        }
    };
    
    // (드래그 관련 이벤트 리스너들은 이전 코드와 거의 동일, 일부 수정)
    let targetTranslate = 0;
    carouselEl.addEventListener('mousedown', (e) => { isDragging = true; startX = e.pageX; carouselEl.style.transition = 'none'; carouselEl.style.cursor = 'grabbing'; });
    carouselEl.addEventListener('mouseleave', () => { if (isDragging) handleDragEnd(); });
    carouselEl.addEventListener('mouseup', () => { if (isDragging) handleDragEnd(); });
    carouselEl.addEventListener('mousemove', (e) => { if (!isDragging) return; e.preventDefault(); const walk = e.pageX - startX; carouselEl.style.transform = `translateX(${currentTranslate + walk}px)`; });
    
    const handleDragEnd = () => {
        isDragging = false;
        carouselEl.style.cursor = 'grab';
        const movedBy = currentTranslate - targetTranslate;
        const activeIndexOffset = Math.round(movedBy / itemWidth);
        const allItems = document.querySelectorAll('.day-item');
        const currentIndex = Array.from(allItems).findIndex(item => item.classList.contains('active'));
        let newIndex = Math.max(0, Math.min(allItems.length - 1, currentIndex - activeIndexOffset));
        snapToIndex(newIndex);
    };

    window.addEventListener('resize', renderAll); // 창 크기 변경 시 대응

    // --- 초기 실행 ---
    renderAll();
});
