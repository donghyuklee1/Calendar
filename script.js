document.addEventListener('DOMContentLoaded', () => {
    // --- 상태 변수 및 DOM 요소 ---
    const monthYearEl = document.getElementById('current-month-year');
    const carouselEl = document.getElementById('date-carousel');
    const scheduleListEl = document.getElementById('schedule-list');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    let currentDate = new Date(); // 현재 선택된 날짜
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // --- 렌더링 함수 ---
    const renderAll = () => {
        renderMonth();
        renderDateCarousel();
        renderSchedule();
    };

    const renderMonth = () => {
        monthYearEl.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    };

    const renderDateCarousel = () => {
        carouselEl.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(year, month, i);
            const dayItem = document.createElement('div');
            dayItem.classList.add('day-item');
            dayItem.dataset.date = i;
            dayItem.innerHTML = `<div class="day-number">${i}</div><div class="day-name">${dayNames[day.getDay()]}</div>`;
            carouselEl.appendChild(dayItem);
        }
        snapToDate(currentDate.getDate());
    };

    const renderSchedule = () => {
        scheduleListEl.innerHTML = '';
        // 예시: 9시부터 18시까지 시간 슬롯 생성
        for (let hour = 9; hour <= 18; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.classList.add('time-slot');
            timeSlot.innerHTML = `<span class="time">${hour}:00</span><span class="event"></span>`;
            
            // 터치/클릭 시 일정 추가 기능
            timeSlot.addEventListener('click', () => {
                const newEvent = prompt(`일정을 추가하세요 (${currentDate.getDate()}일 ${hour}:00):`);
                if (newEvent) {
                    timeSlot.querySelector('.event').textContent = newEvent;
                }
            });
            scheduleListEl.appendChild(timeSlot);
        }
    };

    // --- 캐러셀 인터랙션 로직 ---
    let isDragging = false, startX, scrollLeft, currentTranslate = 0, targetTranslate = 0;

    const snapToDate = (date) => {
        const itemWidth = 80;
        const screenCenter = carouselEl.parentElement.offsetWidth / 2;
        targetTranslate = screenCenter - ((date - 1) * itemWidth + itemWidth / 2);
        carouselEl.style.transition = 'transform 0.3s ease-out';
        carouselEl.style.transform = `translateX(${targetTranslate}px)`;
        currentTranslate = targetTranslate;
        updateCarouselStyles();
    };

    const updateCarouselStyles = () => {
        const screenCenter = carouselEl.parentElement.offsetWidth / 2;
        document.querySelectorAll('.day-item').forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distance = Math.abs(screenCenter - itemCenter);

            item.classList.remove('active', 'near');
            if (distance < 40) { // active 범위
                item.classList.add('active');
                const newDate = parseInt(item.dataset.date);
                if (currentDate.getDate() !== newDate) {
                    currentDate.setDate(newDate);
                    renderSchedule(); // 날짜가 바뀌면 스케줄 다시 렌더링
                }
            } else if (distance < 120) { // near 범위
                item.classList.add('near');
            }
        });
    };

    carouselEl.addEventListener('mousedown', (e) => { isDragging = true; startX = e.pageX - carouselEl.offsetLeft; scrollLeft = currentTranslate; carouselEl.style.transition = 'none'; carouselEl.style.cursor = 'grabbing'; });
    carouselEl.addEventListener('mouseleave', () => { if (isDragging) snapOnMouseUp(); isDragging = false; carouselEl.style.cursor = 'grab';});
    carouselEl.addEventListener('mouseup', () => { if (isDragging) snapOnMouseUp(); isDragging = false; carouselEl.style.cursor = 'grab'; });
    carouselEl.addEventListener('mousemove', (e) => { if (!isDragging) return; e.preventDefault(); const x = e.pageX - carouselEl.offsetLeft; const walk = x - startX; currentTranslate = scrollLeft + walk; carouselEl.style.transform = `translateX(${currentTranslate}px)`; updateCarouselStyles(); });
    
    const snapOnMouseUp = () => {
        const itemWidth = 80;
        const screenCenter = carouselEl.parentElement.offsetWidth / 2;
        const offset = screenCenter - currentTranslate;
        const nearestDate = Math.round(offset / itemWidth);
        snapToDate(Math.max(1, nearestDate));
    };

    // --- 이벤트 리스너 ---
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderAll(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderAll(); });
    window.addEventListener('resize', () => snapToDate(currentDate.getDate())); // 창 크기 변경 시 중앙 정렬

    // --- 초기 실행 ---
    renderAll();
});
