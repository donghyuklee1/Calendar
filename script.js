document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 가져오기
    const currentMonthEl = document.getElementById('current-month');
    const weekNavigatorEl = document.getElementById('week-navigator');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    let currentDate = new Date(); // 오늘 날짜를 기준으로 시작
    const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // 주간 네비게이터를 렌더링하는 함수
    const renderWeekNavigator = () => {
        weekNavigatorEl.innerHTML = ''; // 초기화

        // 현재 선택된 날짜를 기준으로 주의 시작(일요일)을 찾음
        let weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());

        // 7일간의 날짜를 네비게이터에 추가
        for (let i = 0; i < 7; i++) {
            let day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);

            const dayItem = document.createElement('div');
            dayItem.classList.add('day-item');

            // 클릭한 날짜를 새로운 currentDate로 설정하고 다시 렌더링
            dayItem.addEventListener('click', () => {
                currentDate = day;
                renderAll();
            });

            // 선택된 날짜에 'selected' 클래스 추가
            if (day.toDateString() === currentDate.toDateString()) {
                dayItem.classList.add('selected');
            }

            dayItem.innerHTML = `
                <div class="day-name">${weekDayNames[day.getDay()]}</div>
                <div class="day-number">${day.getDate()}</div>
            `;
            weekNavigatorEl.appendChild(dayItem);
        }
    };

    // 월 헤더를 렌더링하는 함수
    const renderMonthHeader = () => {
        currentMonthEl.textContent = monthNames[currentDate.getMonth()];
    };

    // 전체를 다시 그리는 함수
    const renderAll = () => {
        renderMonthHeader();
        renderWeekNavigator();
    };

    // 이전 달/주 로직 (간단하게 주로 변경)
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderAll();
    });

    // 다음 달/주 로직 (간단하게 주로 변경)
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderAll();
    });

    // 초기 렌더링
    renderAll();
});
