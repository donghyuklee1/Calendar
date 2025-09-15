document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 선택 ---
    const splashScreen = document.getElementById('splash-screen');
    const slider = document.querySelector('.carousel-slider');
    const viewport = document.querySelector('.carousel-viewport');
    const display = {
        month: document.getElementById('current-month'),
        year: document.getElementById('current-year')
    };
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    // --- 상태 변수 ---
    let currentDate = new Date();
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    let isDragging = false, startX, currentTranslate, startTranslate, animationID;
    let currentIndex = 0;
    const ITEM_WIDTH = 80, ITEM_MARGIN = 5;
    const TOTAL_ITEM_WIDTH = ITEM_WIDTH + (ITEM_MARGIN * 2);
    const MAX_ITEMS = 150, BUFFER_ITEMS = 30;

    // --- 캘린더 생성 및 업데이트 ---
    function regenerateCalendar(targetDate, initialDay = 1) {
        currentDate = new Date(targetDate);
        slider.innerHTML = '';
        const year = currentDate.getFullYear(), month = currentDate.getMonth();
        const daysToRender = [];
        const baseDate = new Date(year, month, initialDay);

        for (let i = -BUFFER_ITEMS; i <= BUFFER_ITEMS; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);
            daysToRender.push(date);
        }
        
        slider.append(...daysToRender.map(createDateItem));
        currentIndex = BUFFER_ITEMS;
        updateHeader();
        updateTheme(month);
        snapToPosition(false);
    }
    
    function createDateItem(date) {
        const item = document.createElement('div');
        item.className = 'date-item';
        item.dataset.date = date.toISOString().split('T')[0];
        if (date.getTime() === today.getTime()) item.classList.add('today');
        item.innerHTML = `
            <span class="day-of-week">${date.toLocaleString('ko-KR', { weekday: 'short' })}</span>
            <span class="day-number">${date.getDate()}</span>
        `;
        return item;
    }

    function updateHeader() {
        display.month.textContent = currentDate.toLocaleString('ko-KR', { month: 'long' });
        display.year.textContent = currentDate.getFullYear();
    }

    // --- 월 변경 로직 (버그 수정) ---
    function changeMonth(direction) {
        // 현재 날짜의 연, 월을 기준으로 새 Date 객체를 만들어 예상치 못한 동작을 방지합니다.
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        newDate.setMonth(newDate.getMonth() + direction);
        regenerateCalendar(newDate);
    }
    
    // --- 무한 스크롤 로직 ---
    function prependDays() {
        const firstItem = slider.firstElementChild;
        const firstDate = new Date(firstItem.dataset.date + 'T00:00:00');
        const itemsToAdd = [];
        for (let i = 0; i < BUFFER_ITEMS; i++) {
            const newDate = new Date(firstDate);
            newDate.setDate(firstDate.getDate() - (BUFFER_ITEMS - i));
            itemsToAdd.push(createDateItem(newDate));
        }
        slider.prepend(...itemsToAdd);
        
        const widthAdded = BUFFER_ITEMS * TOTAL_ITEM_WIDTH;
        currentTranslate += widthAdded;
        startTranslate += widthAdded;
        currentIndex += BUFFER_ITEMS;
        slider.style.transform = `translateX(${currentTranslate}px)`;

        while(slider.children.length > MAX_ITEMS) {
            slider.lastElementChild.remove();
        }
    }
    
    function appendDays() {
        const lastItem = slider.lastElementChild;
        const lastDate = new Date(lastItem.dataset.date + 'T00:00:00');
        const itemsToAdd = [];
        for (let i = 1; i <= BUFFER_ITEMS; i++) {
            const newDate = new Date(lastDate);
            newDate.setDate(lastDate.getDate() + i);
            itemsToAdd.push(createDateItem(newDate));
        }
        slider.append(...itemsToAdd);

        while(slider.children.length > MAX_ITEMS) {
            const widthRemoved = TOTAL_ITEM_WIDTH;
            slider.firstElementChild.remove();
            currentTranslate -= widthRemoved;
            startTranslate -= widthRemoved;
            currentIndex--;
        }
    }
    
    // --- 드래그 & 애니메이션 로직 (최적화) ---
    function dragStart(e) {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        startTranslate = currentTranslate;
        slider.classList.add('grabbing');
        cancelAnimationFrame(animationID);
    }

    function drag(e) {
        if (!isDragging) return;
        const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = currentX - startX;
        currentTranslate = startTranslate + diff;
        animationID = requestAnimationFrame(updateSliderPosition);
    }
    
    function dragEnd() {
        if (!isDragging) return;
        isDragging = false;
        slider.classList.remove('grabbing');
        cancelAnimationFrame(animationID);
        
        const movedBy = currentTranslate - startTranslate;
        const itemsMoved = Math.round(movedBy / TOTAL_ITEM_WIDTH);
        currentIndex = Math.max(0, Math.min(slider.children.length - 1, currentIndex - itemsMoved));
        
        if (currentIndex < BUFFER_ITEMS / 2) prependDays();
        if (currentIndex > slider.children.length - (BUFFER_ITEMS / 2)) appendDays();

        snapToPosition(true);
    }
    
    function updateSliderPosition() {
        slider.style.transform = `translateX(${currentTranslate}px)`;
        updateItemsStyle();
    }
    
    function snapToPosition(useAnimation = true) {
        const centerOffset = (viewport.offsetWidth / 2) - (TOTAL_ITEM_WIDTH / 2);
        currentTranslate = -currentIndex * TOTAL_ITEM_WIDTH + centerOffset;
        slider.style.transition = useAnimation ? 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
        slider.style.transform = `translateX(${currentTranslate}px)`;
        
        const activeDateEl = slider.children[currentIndex];
        if (activeDateEl) {
            const activeDate = new Date(activeDateEl.dataset.date + 'T00:00:00');
            if (currentDate.getMonth() !== activeDate.getMonth()) {
                currentDate = activeDate;
                updateTheme(currentDate.getMonth());
            } else {
                currentDate = activeDate;
            }
            updateHeader();
        }
        setTimeout(updateItemsStyle, useAnimation ? 50 : 0);
    }

    function updateItemsStyle() {
        const viewportCenter = viewport.getBoundingClientRect().left + viewport.offsetWidth / 2;
        for (const item of slider.children) {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distanceFromCenter = itemCenter - viewportCenter;
            const scale = Math.max(0.75, 1 - Math.abs(distanceFromCenter) * 0.0015);
            const rotationY = distanceFromCenter * 0.08;
            const opacity = Math.max(0.35, 1 - Math.abs(distanceFromCenter) * 0.004);
            item.style.transform = `rotateY(${rotationY}deg) scale(${scale})`;
            item.style.opacity = opacity;
            item.classList.toggle('active', Math.abs(distanceFromCenter) < TOTAL_ITEM_WIDTH / 2);
        }
    }
    
    function updateTheme(month) {
        const root = document.documentElement;
        let theme = { '--bg-grad-1': '#0f3460', '--bg-grad-2': '#16213e', '--accent-color': '#5eead4' };
        if ([11, 0, 1].includes(month)) { // 겨울
            theme = {'--bg-grad-1': '#1a1a2e', '--bg-grad-2': '#16213e', '--accent-color': '#80deea'};
        } else if ([2, 3, 4].includes(month)) { // 봄
            theme = {'--bg-grad-1': '#004d40', '--bg-grad-2': '#00695c', '--accent-color': '#84ffff'};
        } else if ([5, 6, 7].includes(month)) { // 여름
            theme = {'--bg-grad-1': '#01579b', '--bg-grad-2': '#0277bd', '--accent-color': '#40c4ff'};
        }
        Object.entries(theme).forEach(([key, value]) => root.style.setProperty(key, value));
    }
    
    function initialize() {
        setTimeout(() => { splashScreen.classList.add('fade-out'); }, 1000);

        regenerateCalendar(new Date(), new Date().getDate());

        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
        
        slider.addEventListener('mousedown', dragStart);
        window.addEventListener('mousemove', drag);
        window.addEventListener('mouseup', dragEnd);
        
        slider.addEventListener('touchstart', dragStart, { passive: true });
        window.addEventListener('touchmove', drag);
        window.addEventListener('touchend', dragEnd);
        
        window.addEventListener('resize', () => snapToPosition(false));
    }

    initialize();
});
