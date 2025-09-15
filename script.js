document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 요소 선택 ---
    const slider = document.querySelector('.carousel-slider');
    const viewport = document.querySelector('.carousel-viewport');
    const currentDateDisplay = {
        year: document.getElementById('current-year'),
        month: document.getElementById('current-month')
    };
    const modal = {
        overlay: document.getElementById('date-picker-modal'),
        yearList: document.getElementById('year-list'),
        monthGrid: document.getElementById('month-grid'),
        confirmBtn: document.getElementById('confirm-date-btn')
    };
    
    // --- 상태 변수 ---
    let currentDate = new Date();
    let today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()); // 시간 제거
    
    let isDragging = false;
    let startX, currentTranslate, startTranslate, animationID;
    let currentIndex = 0;
    
    const ITEM_WIDTH = 90;
    const ITEM_MARGIN = 8;
    const TOTAL_ITEM_WIDTH = ITEM_WIDTH + (ITEM_MARGIN * 2);

    let tempSelectedYear = currentDate.getFullYear();
    let tempSelectedMonth = currentDate.getMonth();

    // --- 캘린더 생성 및 업데이트 ---
    function regenerateCalendar(targetDate) {
        currentDate = targetDate;
        slider.innerHTML = ''; // 기존 아이템 삭제

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1);

        const daysToRender = [];
        // 이전 달의 날짜 일부 추가
        for (let i = 0; i < 15; i++) {
            const date = new Date(firstDayOfMonth);
            date.setDate(date.getDate() - (15 - i));
            daysToRender.push(date);
        }
        
        // 현재 달의 모든 날짜 추가
        for (let i = 1; i <= daysInMonth; i++) {
            daysToRender.push(new Date(year, month, i));
        }

        // 다음 달의 날짜 일부 추가
        const lastDayOfMonth = new Date(year, month, daysInMonth);
        for (let i = 1; i <= 15; i++) {
            const date = new Date(lastDayOfMonth);
            date.setDate(date.getDate() + i);
            daysToRender.push(date);
        }

        const fragment = document.createDocumentFragment();
        daysToRender.forEach(date => fragment.appendChild(createDateItem(date)));
        slider.appendChild(fragment);

        currentIndex = 15; // 현재 달의 1일
        updateHeader();
        updateTheme(month);
        snapToPosition(false); // 애니메이션 없이 즉시 이동
    }

    function createDateItem(date) {
        const item = document.createElement('div');
        item.className = 'date-item';
        item.dataset.date = date.toISOString().split('T')[0];
        
        if (date.getTime() === today.getTime()) {
            item.classList.add('today');
        }

        item.innerHTML = `
            <span class="day-of-week">${date.toLocaleDateString('ko-KR', { weekday: 'short' })}</span>
            <span class="day-number">${date.getDate()}</span>
        `;
        return item;
    }
    
    function updateHeader() {
        currentDateDisplay.year.textContent = currentDate.getFullYear();
        currentDateDisplay.month.textContent = currentDate.getMonth() + 1;
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
        
        // requestAnimationFrame으로 렌더링 최적화
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
        
        snapToPosition(true); // 애니메이션과 함께 스냅
    }
    
    function updateSliderPosition() {
        slider.style.transition = 'none';
        slider.style.transform = `translateX(${currentTranslate}px)`;
        updateItemsStyle();
    }
    
    function snapToPosition(useAnimation = true) {
        currentTranslate = -currentIndex * TOTAL_ITEM_WIDTH + (viewport.offsetWidth / 2) - (TOTAL_ITEM_WIDTH / 2);
        
        if (useAnimation) {
            slider.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
        } else {
            slider.style.transition = 'none';
        }
        
        slider.style.transform = `translateX(${currentTranslate}px)`;
        
        // 활성화된 날짜 업데이트
        const activeDate = slider.children[currentIndex]?.dataset.date;
        if (activeDate) {
            currentDate = new Date(activeDate + 'T00:00:00');
            updateHeader();
        }

        // 스타일 업데이트는 약간의 지연 후 실행하여 부드러운 전환 보장
        setTimeout(updateItemsStyle, useAnimation ? 50 : 0);
    }

    // --- 3D '일렁임' 효과 로직 ---
    function updateItemsStyle() {
        const viewportCenter = viewport.getBoundingClientRect().left + viewport.offsetWidth / 2;
        for (const item of slider.children) {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distanceFromCenter = itemCenter - viewportCenter;

            const scale = Math.max(0.7, 1 - Math.abs(distanceFromCenter) * 0.0015);
            const rotationY = distanceFromCenter * 0.08;
            const opacity = Math.max(0.3, 1 - Math.abs(distanceFromCenter) * 0.004);

            item.style.transform = `rotateY(${rotationY}deg) scale(${scale})`;
            item.style.opacity = opacity;

            item.classList.toggle('active', Math.abs(distanceFromCenter) < TOTAL_ITEM_WIDTH / 2);
        }
    }
    
    // --- 동적 테마 변경 ---
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
    
    // --- 날짜 선택 모달 로직 ---
    function setupModal() {
        // 연도 목록 생성
        const currentYear = new Date().getFullYear();
        for (let year = currentYear + 10; year >= currentYear - 50; year--) {
            const li = document.createElement('li');
            li.textContent = year;
            li.dataset.year = year;
            modal.yearList.appendChild(li);
        }

        // 월 목록 생성
        for (let month = 0; month < 12; month++) {
            const div = document.createElement('div');
            div.textContent = `${month + 1}월`;
            div.dataset.month = month;
            modal.monthGrid.appendChild(div);
        }
        
        // 이벤트 위임
        modal.yearList.addEventListener('click', e => {
            if(e.target.tagName === 'LI') {
                tempSelectedYear = parseInt(e.target.dataset.year);
                updateModalSelection();
            }
        });
        modal.monthGrid.addEventListener('click', e => {
            if(e.target.dataset.month) {
                tempSelectedMonth = parseInt(e.target.dataset.month);
                updateModalSelection();
            }
        });

        document.getElementById('current-date-display').addEventListener('click', openModal);
        modal.overlay.addEventListener('click', (e) => e.target === modal.overlay && closeModal());
        modal.confirmBtn.addEventListener('click', () => {
            regenerateCalendar(new Date(tempSelectedYear, tempSelectedMonth, 1));
            closeModal();
        });
    }

    function openModal() {
        tempSelectedYear = currentDate.getFullYear();
        tempSelectedMonth = currentDate.getMonth();
        updateModalSelection();
        modal.overlay.classList.add('visible');
        
        // 선택된 연도로 스크롤
        const selectedYearEl = modal.yearList.querySelector('.selected');
        if(selectedYearEl) {
            selectedYearEl.scrollIntoView({ block: 'center' });
        }
    }

    function closeModal() {
        modal.overlay.classList.remove('visible');
    }

    function updateModalSelection() {
        // 연도 선택 업데이트
        modal.yearList.querySelectorAll('li').forEach(li => {
            li.classList.toggle('selected', parseInt(li.dataset.year) === tempSelectedYear);
        });
        // 월 선택 업데이트
        modal.monthGrid.querySelectorAll('div').forEach(div => {
            div.classList.toggle('selected', parseInt(div.dataset.month) === tempSelectedMonth);
        });
    }
    
    // --- 초기화 ---
    function initialize() {
        regenerateCalendar(new Date());
        setupModal();

        slider.addEventListener('mousedown', dragStart);
        window.addEventListener('mousemove', drag);
        window.addEventListener('mouseup', dragEnd);
        
        slider.addEventListener('touchstart', dragStart, { passive: true });
        window.addEventListener('touchmove', drag, { passive: true });
        window.addEventListener('touchend', dragEnd);
        
        window.addEventListener('resize', () => snapToPosition(false));
    }

    initialize();
});
