document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 선택 ---
    const mainContainer = document.getElementById('main-container');
    const scheduleView = document.getElementById('schedule-view');
    const slider = document.querySelector('.carousel-slider');
    // ... (기존 DOM 요소 선택은 동일)
    const backBtn = document.getElementById('back-btn');
    const scheduleDateDisplay = document.getElementById('schedule-date-display');
    const timelineContainer = document.getElementById('timeline-container');
    
    // --- 상태 변수 ---
    let currentDate = new Date();
    // ... (기존 상태 변수는 동일)

    // --- (신규) 일정 데이터 저장소 ---
    // 실제 앱에서는 이 데이터를 localStorage나 서버에 저장해야 합니다.
    let events = {
        "2025-09-17": [
            { start: 9, duration: 1.5, title: "팀 전체 회의" },
            { start: 14, duration: 1, title: "디자인 시안 검토" }
        ]
    };

    // --- (신규) 뷰 전환 로직 ---
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

    // --- (신규) 타임라인 렌더링 로직 ---
    function renderTimeline(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        scheduleDateDisplay.textContent = date.toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        });
        timelineContainer.innerHTML = '';

        const fragment = document.createDocumentFragment();
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.dataset.hour = hour;

            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            if (hour > 0) {
                const displayHour = hour > 12 ? hour - 12 : hour;
                const ampm = hour >= 12 ? '오후' : '오전';
                if (hour === 12) { timeLabel.textContent = `오후 12시`; }
                else { timeLabel.textContent = `${ampm} ${displayHour}시`; }
            }

            const timeLine = document.createElement('div');
            timeLine.className = 'time-line';

            timeSlot.append(timeLabel, timeLine);
            fragment.appendChild(timeSlot);
        }
        timelineContainer.appendChild(fragment);

        const dayEvents = events[dateString] || [];
        dayEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.textContent = event.title;
            const hourHeight = 60; // 1시간의 높이 (px)
            eventItem.style.top = `${event.start * hourHeight}px`;
            eventItem.style.height = `${event.duration * hourHeight - 2}px`; // -2px for padding
            const targetTimeLine = timelineContainer.querySelector(`.time-slot[data-hour='${Math.floor(event.start)}'] .time-line`);
            if(targetTimeLine) targetTimeLine.appendChild(eventItem);
        });

        timelineContainer.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                if (e.target.classList.contains('event-item')) return;
                const hour = slot.dataset.hour;
                const title = prompt(`${dateString} ${hour}:00의 새 일정 제목을 입력하세요:`);
                if (title) {
                    addEvent(dateString, { start: parseInt(hour), duration: 1, title });
                }
            });
        });
    }
    
    // --- (신규) 이벤트 추가 함수 ---
    function addEvent(dateString, newEvent) {
        if (!events[dateString]) {
            events[dateString] = [];
        }
        events[dateString].push(newEvent);
        events[dateString].sort((a, b) => a.start - b.start);
        renderTimeline(dateString); // 화면 새로고침
        regenerateCalendar(currentDate, currentDate.getDate()); // 캘린더의 점 표시 업데이트
    }

    // --- 기존 캘린더 로직 (createDateItem 수정) ---
    function createDateItem(date) {
        const item = document.createElement('div');
        item.className = 'date-item';
        const dateString = date.toISOString().split('T')[0];
        item.dataset.date = dateString;

        if (date.getTime() === today.getTime()) item.classList.add('today');

        // 일정이 있는 날에 점 추가
        if (events[dateString] && events[dateString].length > 0) {
            const dot = document.createElement('div');
            dot.className = 'event-dot';
            item.appendChild(dot);
        }

        item.innerHTML += `
            <span class="day-of-week">${date.toLocaleString('ko-KR', { weekday: 'short' })}</span>
            <span class="day-number">${date.getDate()}</span>
        `;
        
        // 클릭 시 스케줄 뷰로 전환
        item.addEventListener('click', () => showScheduleView(dateString));
        
        return item;
    }

    // --- 나머지 기존 함수들 ... ---
    // (regenerateCalendar, updateHeader, changeMonth, 드래그/애니메이션 함수들은 이전과 동일)
    
    function initialize() {
        // (필수 요소 체크 로직은 간결함을 위해 생략, 이전 코드 참고)
        regenerateCalendar(new Date(), new Date().getDate());

        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
        backBtn.addEventListener('click', hideScheduleView); // 뒤로가기 버튼 이벤트
        
        // PC 및 모바일 이벤트 리스너 (이전과 동일)
        slider.addEventListener('mousedown', dragStart);
        // ...
    }

    // (전체 코드를 복사&붙여넣기 할 수 있도록 모든 함수를 포함합니다)
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    let isDragging = false, startX, currentTranslate = 0, startTranslate, animationID;
    let currentIndex = 0;
    const ITEM_MARGIN = 5;
    const MAX_ITEMS = 150, BUFFER_ITEMS = 30;
    function regenerateCalendar(targetDate, initialDay = 1) { currentDate = new Date(targetDate); slider.innerHTML = ''; const year = currentDate.getFullYear(), month = currentDate.getMonth(); const daysToRender = []; const baseDate = new Date(year, month, initialDay); for (let i = -BUFFER_ITEMS; i <= BUFFER_ITEMS; i++) { const date = new Date(baseDate); date.setDate(baseDate.getDate() + i); daysToRender.push(date); } slider.append(...daysToRender.map(createDateItem)); currentIndex = BUFFER_ITEMS; updateHeader(); updateTheme(month); snapToPosition(false); }
    function updateHeader() { const display = { month: document.getElementById('current-month'), year: document.getElementById('current-year') }; display.month.textContent = currentDate.toLocaleString('ko-KR', { month: 'long' }); display.year.textContent = currentDate.getFullYear(); }
    function changeMonth(direction) { const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); newDate.setMonth(newDate.getMonth() + direction); regenerateCalendar(newDate); }
    function prependDays() { const firstItem = slider.firstElementChild; if (!firstItem) return; const firstDate = new Date(firstItem.dataset.date + 'T00:00:00'); const itemsToAdd = []; for (let i = 0; i < BUFFER_ITEMS; i++) { const newDate = new Date(firstDate); newDate.setDate(firstDate.getDate() - (BUFFER_ITEMS - i)); itemsToAdd.push(createDateItem(newDate)); } slider.prepend(...itemsToAdd); const totalItemWidth = getTotalItemWidth(); const widthAdded = BUFFER_ITEMS * totalItemWidth; currentTranslate += widthAdded; startTranslate += widthAdded; currentIndex += BUFFER_ITEMS; slider.style.transform = `translateX(${currentTranslate}px)`; while (slider.children.length > MAX_ITEMS) { slider.lastElementChild.remove(); } }
    function appendDays() { const lastItem = slider.lastElementChild; if (!lastItem) return; const lastDate = new Date(lastItem.dataset.date + 'T00:00:00'); const itemsToAdd = []; for (let i = 1; i <= BUFFER_ITEMS; i++) { const newDate = new Date(lastDate); newDate.setDate(lastDate.getDate() + i); itemsToAdd.push(createDateItem(newDate)); } slider.append(...itemsToAdd); const totalItemWidth = getTotalItemWidth(); while (slider.children.length > MAX_ITEMS) { slider.firstElementChild.remove(); currentTranslate -= totalItemWidth; startTranslate -= totalItemWidth; currentIndex--; } }
    function dragStart(e) { isDragging = true; startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX; startTranslate = currentTranslate; slider.classList.add('grabbing'); cancelAnimationFrame(animationID); }
    function drag(e) { if (!isDragging) return; if (e.type.includes('touch')) { e.preventDefault(); } const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX; const diff = currentX - startX; currentTranslate = startTranslate + diff; animationID = requestAnimationFrame(updateSliderPosition); }
    function dragEnd() { if (!isDragging) return; isDragging = false; slider.classList.remove('grabbing'); cancelAnimationFrame(animationID); const totalItemWidth = getTotalItemWidth(); const movedBy = currentTranslate - startTranslate; const itemsMoved = Math.round(movedBy / totalItemWidth); currentIndex = Math.max(0, Math.min(slider.children.length - 1, currentIndex - itemsMoved)); if (currentIndex < BUFFER_ITEMS / 2) prependDays(); if (currentIndex > slider.children.length - (BUFFER_ITEMS / 2)) appendDays(); snapToPosition(true); }
    function updateSliderPosition() { slider.style.transform = `translateX(${currentTranslate}px)`; updateItemsStyle(); }
    function snapToPosition(useAnimation = true) { const totalItemWidth = getTotalItemWidth(); const viewport = document.querySelector('.carousel-viewport'); const centerOffset = (viewport.offsetWidth / 2) - (totalItemWidth / 2); currentTranslate = -currentIndex * totalItemWidth + centerOffset; slider.style.transition = useAnimation ? 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'; slider.style.transform = `translateX(${currentTranslate}px)`; const activeDateEl = slider.children[currentIndex]; if (activeDateEl) { const activeDate = new Date(activeDateEl.dataset.date + 'T00:00:00'); currentDate = activeDate; updateHeader(); updateTheme(currentDate.getMonth()); } setTimeout(updateItemsStyle, useAnimation ? 50 : 0); }
    function updateItemsStyle() { const viewport = document.querySelector('.carousel-viewport'); const viewportCenter = viewport.getBoundingClientRect().left + viewport.offsetWidth / 2; const totalItemWidth = getTotalItemWidth(); for (const item of slider.children) { const itemRect = item.getBoundingClientRect(); const itemCenter = itemRect.left + itemRect.width / 2; const distanceFromCenter = itemCenter - viewportCenter; const scale = Math.max(0.75, 1 - Math.abs(distanceFromCenter) * 0.0015); const rotationY = distanceFromCenter * 0.08; const opacity = Math.max(0.35, 1 - Math.abs(distanceFromCenter) * 0.004); item.style.transform = `rotateY(${rotationY}deg) scale(${scale})`; item.style.opacity = opacity; item.classList.toggle('active', Math.abs(distanceFromCenter) < totalItemWidth / 2); } }
    function updateTheme(month) { const root = document.documentElement; let theme = { '--bg-grad-1': '#0f3460', '--bg-grad-2': '#16213e', '--accent-color': '#5eead4' }; if ([11, 0, 1].includes(month)) { theme = {'--bg-grad-1': '#1a1a2e', '--bg-grad-2': '#16213e', '--accent-color': '#80deea'}; } else if ([2, 3, 4].includes(month)) { theme = {'--bg-grad-1': '#004d40', '--bg-grad-2': '#00695c', '--accent-color': '#84ffff'}; } else if ([5, 6, 7].includes(month)) { theme = {'--bg-grad-1': '#01579b', '--bg-grad-2': '#0277bd', '--accent-color': '#40c4ff'}; } Object.entries(theme).forEach(([key, value]) => root.style.setProperty(key, value)); }
    function getTotalItemWidth() { const itemWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--item-width')); return itemWidth + (ITEM_MARGIN * 2); }
    
    initialize();
});
