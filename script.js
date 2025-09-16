document.addEventListener('DOMContentLoaded', () => {
    const monthYearDisplay = document.getElementById('month-year');
    const datesContainer = document.getElementById('dates-container');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const timeline = document.getElementById('timeline');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    let currentDate = new Date(2025, 8, 16); // 2025년 9월 16일로 시작 (JS 월은 0-11)

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
            dateItem.dataset.date = date.toISOString().split('T')[0];

            const dayName = document.createElement('span');
            dayName.className = 'day-name';
            dayName.textContent = date.toLocaleDateString('ko-KR', { weekday: 'short' });
            
            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;

            dateItem.appendChild(dayName);
            dateItem.appendChild(dayNumber);
            datesContainer.appendChild(dateItem);

            if (day === currentDate.getDate()) {
                dateItem.classList.add('active');
            }
        }
        addDateClickListeners();
        updateSchedulePanel();
        renderTimeline();
        
        setTimeout(() => {
            const activeDateEl = datesContainer.querySelector('.active');
            if(activeDateEl) centerActiveDate(activeDateEl);
        }, 100);
    }

    function addDateClickListeners() {
        document.querySelectorAll('.date-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // isDragging 플래그를 확인하여 드래그 직후 클릭이벤트 방지
                if(isDragging) return;

                const currentActive = datesContainer.querySelector('.active');
                if (currentActive) {
                    currentActive.classList.remove('active');
                }
                item.classList.add('active');
                currentDate = new Date(item.dataset.date);
                updateSchedulePanel();
                centerActiveDate(item);
            });
        });
    }

    function updateSchedulePanel() {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        selectedDateDisplay.textContent = currentDate.toLocaleDateString('ko-KR', options);
    }

    function renderTimeline() {
        timeline.innerHTML = '';
        for (let hour = 8; hour <= 22; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.innerHTML = `
                <span class="time-label">${hour}:00</span>
                <div class="event-placeholder">+ 새 일정 추가</div>
            `;
            timeline.appendChild(timeSlot);
        }
    }
    
    function centerActiveDate(activeElement) {
        if (!activeElement) return;
        const container = document.querySelector('.date-carousel');
        const scrollLeft = activeElement.offsetLeft - (container.offsetWidth / 2) + (activeElement.offsetWidth / 2);
        container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // --- 드래그 & 스와이프 기능 ---
    let isDown = false;
    let startX;
    let scrollLeft;
    let isDragging = false; // 드래그와 클릭을 구분하기 위한 플래그

    const carousel = document.querySelector('.date-carousel');

    const startDrag = (e) => {
        isDown = true;
        isDragging = false;
        carousel.classList.add('active-drag');
        datesContainer.style.cursor = 'grabbing';
        startX = (e.pageX || e.touches[0].pageX) - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
    };

    const endDrag = () => {
        isDown = false;
        carousel.classList.remove('active-drag');
        datesContainer.style.cursor = 'grab';
        // 짧은 드래그는 클릭으로 간주되지 않도록 isDragging 플래그 사용
        setTimeout(() => isDragging = false, 50); 
    };

    const doDrag = (e) => {
        if (!isDown) return;
        e.preventDefault();
        isDragging = true;
        const x = (e.pageX || e.touches[0].pageX) - carousel.offsetLeft;
        const walk = (x - startX) * 2; // 스크롤 속도
        carousel.scrollLeft = scrollLeft - walk;
    };

    // 마우스 이벤트
    carousel.addEventListener('mousedown', startDrag);
    carousel.addEventListener('mouseleave', endDrag);
    carousel.addEventListener('mouseup', endDrag);
    carousel.addEventListener('mousemove', doDrag);
    
    // 터치 이벤트
    carousel.addEventListener('touchstart', startDrag);
    carousel.addEventListener('touchend', endDrag);
    carousel.addEventListener('touchmove', doDrag);

    // 초기 렌더링
    renderCalendar();
});
