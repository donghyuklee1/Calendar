document.addEventListener('DOMContentLoaded', () => {
    const monthYearDisplay = document.getElementById('month-year');
    const datesContainer = document.getElementById('dates-container');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const timeline = document.getElementById('timeline');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    let currentDate = new Date(2025, 8, 16); // 2025년 9월 16일로 시작 (JS에서 월은 0부터 시작)

    function renderCalendar() {
        datesContainer.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 1. 헤더 월/년도 업데이트
        monthYearDisplay.textContent = `${year}년 ${month + 1}월`;

        // 2. 날짜 캐러셀 생성
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateItem = document.createElement('div');
            dateItem.className = 'date-item';
            dateItem.dataset.date = date.toISOString().split('T')[0]; // 'YYYY-MM-DD' 형식으로 저장

            const dayName = document.createElement('span');
            dayName.className = 'day-name';
            dayName.textContent = date.toLocaleDateString('ko-KR', { weekday: 'short' });
            
            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;

            dateItem.appendChild(dayName);
            dateItem.appendChild(dayNumber);
            datesContainer.appendChild(dateItem);

            // 오늘 날짜와 선택된 날짜가 같으면 active 클래스 추가
            if (day === currentDate.getDate()) {
                dateItem.classList.add('active');
            }

            dateItem.addEventListener('click', () => {
                // 기존 active 클래스 제거
                const currentActive = datesContainer.querySelector('.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                // 새로 클릭된 아이템에 active 클래스 추가
                dateItem.classList.add('active');
                currentDate = new Date(dateItem.dataset.date);
                updateSchedulePanel();
                centerActiveDate(dateItem);
            });
        }
        updateSchedulePanel();
        renderTimeline();
        
        // 초기 렌더링 시 선택된 날짜 중앙 정렬
        setTimeout(() => {
            const activeDateEl = datesContainer.querySelector('.active');
            if(activeDateEl) centerActiveDate(activeDateEl);
        }, 100);
    }

    function updateSchedulePanel() {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        selectedDateDisplay.textContent = currentDate.toLocaleDateString('ko-KR', options);
        // 여기에 선택된 날짜의 실제 일정을 불러오는 로직을 추가할 수 있습니다.
    }

    function renderTimeline() {
        timeline.innerHTML = '';
        for (let hour = 8; hour <= 22; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            
            const timeLabel = document.createElement('span');
            timeLabel.className = 'time-label';
            timeLabel.textContent = `${hour}:00`;
            
            const eventPlaceholder = document.createElement('div');
            eventPlaceholder.className = 'event-placeholder';
            eventPlaceholder.textContent = '+ 새 일정 추가';
            
            timeSlot.appendChild(timeLabel);
            timeSlot.appendChild(eventPlaceholder);
            timeline.appendChild(timeSlot);
        }
    }
    
    function centerActiveDate(activeElement) {
        if (!activeElement) return;
        const containerRect = datesContainer.getBoundingClientRect();
        const elementRect = activeElement.getBoundingClientRect();
        const scrollLeft = datesContainer.scrollLeft + elementRect.left - containerRect.left - (containerRect.width / 2) + (elementRect.width / 2);
        datesContainer.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }

    // 월 이동 버튼 이벤트 리스너
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // 드래그 스크롤 기능 추가
    let isDown = false;
    let startX;
    let scrollLeft;

    datesContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        datesContainer.style.cursor = 'grabbing';
        startX = e.pageX - datesContainer.offsetLeft;
        scrollLeft = datesContainer.scrollLeft;
    });

    datesContainer.addEventListener('mouseleave', () => {
        isDown = false;
        datesContainer.style.cursor = 'grab';
    });

    datesContainer.addEventListener('mouseup', () => {
        isDown = false;
        datesContainer.style.cursor = 'grab';
    });

    datesContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - datesContainer.offsetLeft;
        const walk = (x - startX) * 2; // 스크롤 속도 조절
        datesContainer.scrollLeft = scrollLeft - walk;
    });
    
    // 초기 렌더링
    renderCalendar();
});
