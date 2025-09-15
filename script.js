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
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()); // 시간 제거
    
    let isDragging = false;
    let startX, currentTranslate, startTranslate, animationID;
    let currentIndex = 0;
    
    const ITEM_WIDTH = 80;
    const ITEM_MARGIN = 5;
    const TOTAL_ITEM_WIDTH = ITEM_WIDTH + (ITEM_MARGIN * 2);

    // --- 캘린더 생성 및 업데이트 ---
    function regenerateCalendar(targetDate, initialDay = 1) {
        currentDate = new Date(targetDate);
        slider.innerHTML = ''; // 기존 아이템 삭제

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 렌더링할 날짜 배열 생성 (전후 15일 포함)
        const daysToRender = [];
        const baseDate = new Date(year, month, initialDay);

        for (let i = -15; i <= (daysInMonth - initialDay + 15); i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);
            daysToRender.push(date);
        }
        
        const fragment = document.createDocumentFragment();
        daysToRender.forEach(date => fragment.appendChild(createDateItem(date)));
        slider.appendChild(fragment);

        currentIndex = 15; // 중앙 인덱스 (초기 날짜)
        updateHeader();
        updateTheme(month);
        snapToPosition(false); // 애니메이션 없이 즉시 이동
    }

    function createDateItem(date) {
        const item = document.createElement('div');
        item.className = 'date-item';
        item.dataset.date = date.toISOString().split('T')[0];
        
        if (date.getTime() === today.getTime()) item.classList.add('today');

        item.innerHTML = `
            <span class="day-of-week">${date.toLocaleDateString('ko-KR', { weekday: 'short' })}</span>
            <span class="day-number">${date.getDate()}</span>
        `;
        return item;
    }
    
    function updateHeader() {
        display.month.textContent = currentDate.toLocaleDateString('ko-KR', { month: 'long' });
        display.year.textContent = currentDate.getFullYear();
    }

    // --- 월 변경 로직 ---
    function changeMonth(direction) {
        currentDate.setMonth(currentDate.getMonth() + direction, 1); // 날짜를 1일로 설정하여 오류 방지
        regenerateCalendar(currentDate);
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
        let theme = {
            '--bg-grad-1': '#0f3460', '--bg-grad-2': '#16213e', '--accent-color': '#5eead4' // 가을
        };
        if ([11, 0, 1].includes(month)) { // 겨울: 12, 1, 2월
            theme = {'--bg-grad-1': '#1a1a2e', '--bg-grad-2': '#16213e', '--accent-color': '#80deea'};
        } else if ([2, 3, 4].includes(month)) { // 봄: 3, 4, 5월
            theme = {'--bg-grad-1': '#004d40', '--bg-grad-2': '#00695c', '--accent-color': '#84ffff'};
        } else if ([5, 6, 7].includes(month)) { // 여름: 6, 7, 8월
            theme = {'--bg-grad-1': '#01579b', '--bg-grad-2': '#0277bd', '--accent-color': '#40c4ff'};
        }
        Object.entries(theme).forEach(([key, value]) => root.style.setProperty(key, value));
    }
    
    function initialize() {
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
