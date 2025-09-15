document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.carousel-slider');
    const viewport = document.querySelector('.carousel-viewport');

    const today = new Date();
    let todayIndex = 0;
    const totalDays = 365; // 앞뒤로 1년치 날짜를 생성

    // 캘린더 날짜 아이템 생성
    function generateCalendar() {
        const fragment = document.createDocumentFragment();
        const now = new Date();
        
        // 오늘을 기준으로 과거 182일, 미래 182일 날짜 생성
        for (let i = -Math.floor(totalDays / 2); i <= Math.floor(totalDays / 2); i++) {
            const date = new Date(now);
            date.setDate(now.getDate() + i);

            if (i === 0) {
                todayIndex = Math.floor(totalDays / 2);
            }

            const item = createDateItem(date, i === 0);
            fragment.appendChild(item);
        }
        slider.appendChild(fragment);
    }

    // 개별 날짜 아이템 DOM 생성
    function createDateItem(date, isToday) {
        const dayOfWeek = date.toLocaleDateString('ko-KR', { weekday: 'short' });
        const dayNumber = date.getDate();
        
        const item = document.createElement('div');
        item.classList.add('date-item');
        if (isToday) {
            item.classList.add('today');
        }
        item.dataset.date = date.toISOString().split('T')[0];

        item.innerHTML = `
            <span class="day-of-week">${dayOfWeek}</span>
            <span class="day-number">${dayNumber}</span>
        `;
        return item;
    }
    
    // --- 드래그 및 스와이프 로직 ---
    let isDragging = false;
    let startX;
    let currentTranslate = 0;
    let startTranslate = 0;
    let currentIndex = 0; // 초기화 시점에는 0으로 설정
    const itemWidthWithMargin = 120; // item-width(100) + margin(10*2)

    function setPositionByIndex() {
        currentTranslate = -currentIndex * itemWidthWithMargin;
        slider.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
        slider.style.transform = `translateX(${currentTranslate}px)`;
        updateItemsStyle();
    }

    function dragStart(e) {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        startTranslate = currentTranslate;
        slider.style.transition = 'none'; // 드래그 중에는 transition을 제거하여 즉각 반응
        slider.classList.add('grabbing');
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = currentX - startX;
        currentTranslate = startTranslate + diff;
        slider.style.transform = `translateX(${currentTranslate}px)`;
        updateItemsStyle(); // 드래그하는 동안 실시간으로 스타일 업데이트
    }

    function dragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        slider.classList.remove('grabbing');
        
        // 드래그가 끝났을 때 가장 가까운 아이템으로 스냅
        const movedBy = currentTranslate - startTranslate;
        
        // 얼마나 많은 아이템을 넘어갔는지 계산
        const itemsMoved = Math.round(movedBy / itemWidthWithMargin);
        currentIndex = currentIndex - itemsMoved;
        
        // 인덱스 범위 제한
        currentIndex = Math.max(0, Math.min(slider.children.length - 1, currentIndex));
        
        setPositionByIndex();
    }

    // --- 3D '일렁임' 효과 로직 ---
    function updateItemsStyle() {
        const sliderCenter = slider.getBoundingClientRect().left + slider.offsetWidth / 2;
        const viewportCenter = viewport.getBoundingClientRect().left + viewport.offsetWidth / 2;

        for (let i = 0; i < slider.children.length; i++) {
            const item = slider.children[i];
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distanceFromCenter = itemCenter - viewportCenter;

            // 중심으로부터의 거리에 따라 회전, 스케일, 투명도 조절
            const scale = Math.max(0.7, 1 - Math.abs(distanceFromCenter) * 0.001);
            const rotationY = distanceFromCenter * 0.1; // 이 값을 조절해 회전 강도 변경
            const opacity = Math.max(0.3, 1 - Math.abs(distanceFromCenter) * 0.003);

            item.style.transform = `rotateY(${rotationY}deg) scale(${scale})`;
            item.style.opacity = opacity;

            if (Math.abs(distanceFromCenter) < itemWidthWithMargin / 2) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    }

    // 이벤트 리스너 등록
    function addEventListeners() {
        slider.addEventListener('mousedown', dragStart);
        slider.addEventListener('mousemove', drag);
        slider.addEventListener('mouseup', dragEnd);
        slider.addEventListener('mouseleave', dragEnd); // 마우스가 영역 밖으로 나가도 드래그 종료

        slider.addEventListener('touchstart', dragStart, { passive: false });
        slider.addEventListener('touchmove', drag, { passive: false });
        slider.addEventListener('touchend', dragEnd);
    }
    
    // 초기화 함수
    function initialize() {
        generateCalendar();
        
        // 오늘 날짜가 중앙에 오도록 초기 위치 설정
        currentIndex = todayIndex;
        const initialOffset = (viewport.offsetWidth / 2) - (itemWidthWithMargin / 2);
        slider.style.transform = `translateX(${initialOffset}px)`; // 초기 중앙 정렬을 위한 임시 이동
        
        setPositionByIndex();
        addEventListeners();
    }
    
    initialize();
});
