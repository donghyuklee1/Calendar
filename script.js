document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 선택 ---
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
    let isDragging = false, startX, currentTranslate = 0, startTranslate, animationID;
    let currentIndex = 0;
    
    const ITEM_MARGIN = 5;
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

    // --- 월 변경 로직 ---
    function changeMonth(direction) {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        newDate.setMonth(newDate.getMonth() + direction);
        regenerateCalendar(newDate);
    }
    
    // --- 무한 스크롤 ---
    function prependDays() {
        const firstItem = slider.firstElementChild;
        if (!firstItem) return;
        const firstDate = new Date(firstItem.dataset.date + 'T00:00:00');
        const itemsToAdd = [];
        for (let i = 0; i < BUFFER_ITEMS; i++) {
            const newDate = new Date(firstDate);
            newDate.setDate(firstDate.getDate() - (BUFFER_ITEMS - i));
            itemsToAdd.push(createDateItem(newDate));
        }
        slider.prepend(...itemsToAdd);

        const totalItemWidth = getTotalItemWidth();
        const widthAdded = BUFFER_ITEMS * totalItemWidth;
        currentTranslate += widthAdded;
        startTranslate += widthAdded;
        currentIndex += BUFFER_ITEMS;
        slider.style.transform = `translateX(${currentTranslate}px)`;

        while (slider.children.length > MAX_ITEMS) {
            slider.lastElementChild.remove();
        }
    }
    
    function appendDays() {
        const lastItem = slider.lastElementChild;
        if (!lastItem) return;
        const lastDate = new Date(lastItem.dataset.date + 'T00:00:00');
        const itemsToAdd = [];
        for (let i = 1; i <= BUFFER_ITEMS; i++) {
            const newDate = new Date(lastDate);
            newDate.setDate(lastDate.getDate() + i);
            itemsToAdd.push(createDateItem(newDate));
        }
        slider.append(...itemsToAdd);

        const totalItemWidth = getTotalItemWidth();
        while (slider.children.length > MAX_ITEMS) {
            slider.firstElementChild.remove();
            currentTranslate -= totalItemWidth;
            startTranslate -= totalItemWidth;
            currentIndex--;
        }
    }
    
    // --- 드래그 & 애니메이션 ---
    function dragStart(e) {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        startTranslate = currentTranslate;
        slider.classList.add('grabbing');
        cancelAnimationFrame(animationID);
    }

    function drag(e) {
        if (!isDragging) return;
        if (e.type.includes('touch')) {
            e.preventDefault();
        }
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

        const totalItemWidth = getTotalItemWidth();
        const movedBy = currentTranslate - startTranslate;
        const itemsMoved = Math.round(movedBy / totalItemWidth);
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
        const totalItemWidth = getTotalItemWidth();
        const centerOffset = (viewport.offsetWidth / 2) - (totalItemWidth / 2);
        currentTranslate = -currentIndex * totalItemWidth + centerOffset;
        slider.style.transition = useAnimation ? 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none';
        slider.style.transform = `translateX(${currentTranslate}px)`;
        
        const activeDateEl = slider.children[currentIndex];
        if (activeDateEl) {
            const activeDate = new Date(activeDateEl.dataset.date + 'T00:00:00');
            currentDate = activeDate;
            updateHeader();
            updateTheme(currentDate.getMonth());
        }
        setTimeout(updateItemsStyle, useAnimation ? 50 : 0);
    }

    function updateItemsStyle() {
        const viewportCenter = viewport.getBoundingClientRect().left + viewport.offsetWidth / 2;
        const totalItemWidth = getTotalItemWidth();
        for (const item of slider.children) {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distanceFromCenter = itemCenter - viewportCenter;
            const scale = Math.max(0.75, 1 - Math.abs(distanceFromCenter) * 0.0015);
            const rotationY = distanceFromCenter * 0.08;
            const opacity = Math.max(0.35, 1 - Math.abs(distanceFromCenter) * 0.004);
            item.style.transform = `rotateY(${rotationY}deg) scale(${scale})`;
            item.style.opacity = opacity;
            item.classList.toggle('active', Math.abs(distanceFromCenter) < totalItemWidth / 2);
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
    
    function getTotalItemWidth() {
        const itemWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--item-width'));
        return itemWidth + (ITEM_MARGIN * 2);
    }

    function initialize() {
        if (!slider || !viewport || !prevMonthBtn || !nextMonthBtn) {
            console.error("Calendar initialization failed: One or more essential elements are missing.");
            return;
        }

        regenerateCalendar(new Date(), new Date().getDate());

        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
        
        // PC 이벤트
        slider.addEventListener('mousedown', dragStart);
        window.addEventListener('mousemove', drag);
        window.addEventListener('mouseup', dragEnd);
        window.addEventListener('mouseleave', dragEnd);
        
        // 모바일 이벤트
        slider.addEventListener('touchstart', dragStart, { passive: true });
        window.addEventListener('touchmove', drag, { passive: false });
        window.addEventListener('touchend', dragEnd);
        
        window.addEventListener('resize', () => snapToPosition(false));
    }

    initialize();
});
