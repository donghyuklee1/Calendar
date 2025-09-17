document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소
    const splashScreen = document.getElementById('splash-screen');
    const scheduleModal = document.getElementById('schedule-modal');
    const detailsModal = document.getElementById('details-modal'); // ✨ [추가]
    // ... 나머지 DOM 요소들

    // --- 모달 관련 ---
    let lastFocusedElement;

    function openModal(hour = null) {
        // ... 기존 openModal 로직
    }
    
    function closeModal(modalElement) { // ✨ [수정] 어떤 모달이든 닫도록 변경
        modalElement.classList.remove('visible');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }
    
    // ✨ [추가] 세부 정보 모달 열기
    function openDetailsModal(schedule) {
        lastFocusedElement = document.activeElement;
        
        const color = getCategoryColor(schedule.category);
        document.getElementById('details-header').style.borderLeft = `5px solid ${color.hex}`;
        document.getElementById('details-modal-title').textContent = schedule.category;
        document.getElementById('details-time').textContent = `${schedule.startTime} - ${schedule.endTime}`;
        const locationEl = document.getElementById('details-location');
        if (schedule.location) {
            locationEl.textContent = schedule.location;
            locationEl.style.display = 'flex';
        } else {
            locationEl.style.display = 'none';
        }
        const memoEl = document.getElementById('details-memo');
        if(schedule.memo){
            memoEl.textContent = schedule.memo;
            memoEl.style.display = 'flex';
        } else {
            memoEl.style.display = 'none';
        }

        detailsModal.classList.add('visible');
        document.getElementById('close-details-btn').focus();
    }

    // --- UI 렌더링 ---
    function renderTimeline() {
        // ...
        filteredSchedules.forEach(schedule => {
            // ...
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.dataset.id = schedule.id; // ✨ [추가] 클릭 시 식별을 위한 ID
            // ...
            
            // ✨ [수정] 위치 정보 표시
            const locationHTML = schedule.location ? `<span class="location">📍 ${schedule.location}</span>` : '';
            eventItem.innerHTML = `
                <div class="event-item-header">
                    <span class="category">${schedule.category}</span>
                    <button class="delete-btn" data-id="${schedule.id}">&times;</button>
                </div>
                <span class="memo">${schedule.memo}</span>
                ${locationHTML}
            `;
            timelineEvents.appendChild(eventItem);
        });
        // ...
    }

    // --- 이벤트 핸들러 ---
    function handleScheduleSubmit(e) {
        e.preventDefault();
        // ...
        const newSchedule = {
            id: Date.now(),
            category: document.getElementById('schedule-category').value || "#기타",
            location: document.getElementById('schedule-location').value, // ✨ [추가] 위치 정보 가져오기
            startTime: getSelectedTime('start'),
            // ...
        };
        // ...
        closeModal(scheduleModal); // ✨ [수정]
        // ...
    }

    // ✨ [추가] 일정 클릭 시 세부 정보 보기
    function handleEventClick(e) {
        const eventItem = e.target.closest('.event-item');
        if (!eventItem) return;

        // 삭제 버튼 클릭 시에는 세부 정보 창이 뜨지 않도록 방지
        if (e.target.classList.contains('delete-btn')) return;

        const scheduleId = Number(eventItem.dataset.id);
        const dateKey = toYYYYMMDD(currentDate);
        const schedule = schedules[dateKey]?.find(s => s.id === scheduleId);

        if (schedule) {
            openDetailsModal(schedule);
        }
    }
    
    function handleModalKeydown(modalElement, e) {
        if (e.key === 'Escape') {
            closeModal(modalElement);
        }
        // ... 포커스 트랩 로직 ...
    }


    // --- 이벤트 리스너 등록 ---
    cancelButton.addEventListener('click', () => closeModal(scheduleModal)); // ✨ [수정]
    scheduleModal.addEventListener('click', e => { if (e.target === scheduleModal) closeModal(scheduleModal); }); // ✨ [수정]
    timelineEvents.addEventListener('click', handleEventClick); // ✨ [추가]
    
    // ✨ [추가] 세부 정보 모달 닫기 리스너
    document.getElementById('close-details-btn').addEventListener('click', () => closeModal(detailsModal));
    detailsModal.addEventListener('click', e => { if (e.target === detailsModal) closeModal(detailsModal); });
    
    // ✨ [수정] 각 모달에 맞는 키보드 리스너 등록
    scheduleModal.addEventListener('keydown', (e) => handleModalKeydown(scheduleModal, e));
    detailsModal.addEventListener('keydown', (e) => handleModalKeydown(detailsModal, e));
    
    // --- 초기 실행 ---
    // ...
    // ✨ [수정] 스플래쉬 화면 제어
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        splashScreen.addEventListener('transitionend', () => {
            renderAll(); 
        }, { once: true });
    }, 2000); // 2초 후 페이드 아웃 시작
});
