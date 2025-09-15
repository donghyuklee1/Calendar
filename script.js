document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 가져오기
    const monthYearElement = document.getElementById('current-month-year');
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    // 현재 날짜를 기준으로 Date 객체 생성
    let currentDate = new Date();

    // 캘린더를 렌더링하는 함수
    const renderCalendar = () => {
        // 현재 년도와 월 가져오기
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0: 1월, 1: 2월, ...

        // 헤더에 'YYYY년 MM월' 형식으로 표시
        monthYearElement.textContent = `${year}년 ${month + 1}월`;
        
        // 그리드 초기화 (요일 이름은 제외)
        calendarGrid.innerHTML = `
            <div class="day-name">일</div><div class="day-name">월</div>
            <div class="day-name">화</div><div class="day-name">수</div>
            <div class="day-name">목</div><div class="day-name">금</div>
            <div class="day-name">토</div>
        `;

        // 현재 월의 첫째 날과 마지막 날 구하기
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // 첫째 날의 요일 (0: 일요일, 1: 월요일, ...)
        const startDayOfWeek = firstDayOfMonth.getDay();
        // 마지막 날짜
        const lastDateOfMonth = lastDayOfMonth.getDate();

        // --- 지난 달 날짜 채우기 ---
        const prevLastDay = new Date(year, month, 0);
        const prevLastDate = prevLastDay.getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dateCell = document.createElement('div');
            dateCell.classList.add('date-cell', 'other-month');
            dateCell.textContent = prevLastDate - i;
            calendarGrid.appendChild(dateCell);
        }

        // --- 이번 달 날짜 채우기 ---
        for (let i = 1; i <= lastDateOfMonth; i++) {
            const dateCell = document.createElement('div');
            dateCell.classList.add('date-cell');
            dateCell.textContent = i;
            
            // 오늘 날짜인 경우 'today' 클래스 추가
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                dateCell.classList.add('today');
            }
            
            calendarGrid.appendChild(dateCell);
        }
    };

    // --- 이벤트 리스너 설정 ---
    // 이전 달 버튼 클릭
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    // 다음 달 버튼 클릭
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // 초기 캘린더 렌더링
    renderCalendar();
});
