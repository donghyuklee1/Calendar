document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 선택 (기존 + 신규) ---
    const mainContainer = document.getElementById('main-container');
    const scheduleView = document.getElementById('schedule-view');
    const splashScreen = document.getElementById('splash-screen');
    const slider = document.querySelector('.carousel-slider');
    const viewport = document.querySelector('.carousel-viewport');
    const display = { month: document.getElementById('current-month'), year: document.getElementById('current-year') };
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const backToCalendarBtn = document.getElementById('back-to-calendar-btn');
    const scheduleDateDisplay = document.getElementById('schedule-date-display');
    const timelineContainer = document.getElementById('schedule-timeline-container');
    
    // --- 상태 변수 (기존 + 신규) ---
    let currentDate = new Date();
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    let isDragging = false, startX, currentTranslate, startTranslate, animationID;
    const TOTAL_ITEM_WIDTH = 90;

    // --- (신규) 일정 데이터 저장소 ---
    let events = {
        "2025-09-17": [
            { start: 9, duration: 1.5, title: "팀 전체 회의" },
            { start: 14, duration: 1, title: "디자인 시안 검토" }
        ]
    };

    // --- 캘린더 뷰와 스케줄 뷰 전환 ---
    function showScheduleView(dateString) {
        mainContainer.style.opacity = '0';
        mainContainer.style.transform = 'scale(0.95)';
        scheduleView.classList.add('visible');
        renderTimeline(dateString);
    }

    function hideScheduleView() {
        mainContainer.style.opacity = '1';
        mainContainer.style.transform = 'scale(1)';
        scheduleView.classList.remove('visible');
    }

    // --- (신규) 타임라인 렌더링 ---
    function renderTimeline(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        scheduleDateDisplay.textContent = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        timelineContainer.innerHTML = ''; // 이전 타임라인 초기화

        const fragment = document.createDocumentFragment();
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.dataset.hour = hour;

            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            // 정시마다 시간 표시 (오전/오후)
            if (hour > 0) {
                 const displayHour = hour > 12 ? hour - 12 : hour;
                 const ampm = hour >= 12 ? '오후' : '오전';
                 timeLabel.textContent = `${ampm} ${displayHour}시`;
            }
           
            const timeLine = document.createElement('div');
            timeLine.className = 'time-line';

            timeSlot.append(timeLabel, timeLine);
            fragment.appendChild(timeSlot);
        }
        timelineContainer.appendChild(fragment);

        // 이벤트 렌더링
        const dayEvents = events[dateString] || [];
        dayEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.textContent = event.title;
            
            const hourHeight = 60; // 1시간의 높이 (px)
            eventItem.style.top = `${event.start * hourHeight}px`;
            eventItem.style.height = `${event.duration * hourHeight}px`;

            // 이벤트가 시작하는 시간의 time-line에 추가
            timelineContainer.querySelector(`.time-slot[data-hour='${Math.floor(event.start)}'] .time-line`).appendChild(eventItem);
        });
        
        // (신규) 일정 추가 이벤트 리스너
        timelineContainer.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                // 이미 이벤트가 있는 곳을 클릭하면 추가하지 않음
                if (e.target.classList.contains('event-item')) return;

                const hour = slot.dataset.hour;
                const title = prompt(`${dateString} ${hour}:00, 새 일정 추가:`);
                if (title) {
                    addEvent(dateString, { start: parseInt(hour), duration: 1, title });
                }
            });
        });
    }

    // --- (신규) 이벤트 추가/관리 ---
    function addEvent(dateString, newEvent) {
        if (!events[dateString]) {
            events[dateString] = [];
        }
        events[dateString].push(newEvent);
        // 간단하게 정렬
        events[dateString].sort((a, b) => a.start - b.start);
        renderTimeline(dateString); // 변경사항 반영하여 다시 렌더링
    }


    /* --- 기존 캘린더 로직 (대부분 동일, 클릭 이벤트만 수정) --- */
    
    function regenerateCalendar(targetDate, initialDay = 1) { /* ... 기존과 동일 ... */ }

    function createDateItem(date) {
        const item = document.createElement('div');
        item.className = 'date-item';
        const dateString = date.toISOString().split('T')[0];
        item.dataset.date = dateString;
        
        if (date.getTime() === today.getTime()) item.classList.add('today');

        // (신규) 일정이 있는 날짜에 점 표시
        if (events[dateString]) {
            const dot = document.createElement('div');
            dot.className = 'event-dot'; // (이 스타일은 CSS에 추가해야 합니다)
            item.appendChild(dot);
        }
        
        item.innerHTML += `
            <span class="day-of-week">${date.toLocaleDateString('ko-KR', { weekday: 'short' })}</span>
            <span class="day-number">${date.getDate()}</span>
        `;

        // (수정) 날짜 클릭 시 스케줄 뷰를 보여주도록 이벤트 리스너 추가
        item.addEventListener('click', () => showScheduleView(dateString));

        return item;
    }
    
    function updateHeader() { /* ... 기존과 동일 ... */ }
    function changeMonth(direction) { /* ... 기존과 동일 ... */ }
    function dragStart(e) { /* ... 기존과 동일 ... */ }
    function drag(e) { /* ... 기존과 동일 ... */ }
    function dragEnd() { /* ... 기존과 동일 ... */ }
    function updateSliderPosition() { /* ... 기존과 동일 ... */ }
    function snapToPosition(useAnimation = true) { /* ... 기존과 동일 ... */ }
    function updateItemsStyle() { /* ... 기존과 동일 ... */ }
    function updateTheme(month) { /* ... 기존과 동일 ... */ }

    function initialize() {
        setTimeout(() => { splashScreen.classList.add('fade-out'); }, 1000);
        regenerateCalendar(new Date(), new Date().getDate());

        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
        backToCalendarBtn.addEventListener('click', hideScheduleView); // 뒤로가기 버튼
        
        slider.addEventListener('mousedown', dragStart);
        window.addEventListener('mousemove', drag);
        window.addEventListener('mouseup', dragEnd);
        slider.addEventListener('touchstart', dragStart, { passive: true });
        window.addEventListener('touchmove', drag, { passive: false });
        window.addEventListener('touchend', dragEnd);
        
        window.addEventListener('resize', () => snapToPosition(false));
    }
    
    initialize();

    // 간결함을 위해 생략된 함수들의 전체 코드 (기존과 동일)
    // regenerateCalendar, updateHeader, changeMonth, drag/snap/update 함수들...
});
