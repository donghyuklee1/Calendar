const yearElement = document.getElementById('year');
const monthContainer = document.querySelector('.month-container');
const calendarContainer = document.querySelector('.calendar-container');

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1-12

function buildMonthCarousel() {
    monthContainer.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
        const monthDiv = document.createElement('div');
        monthDiv.classList.add('month');
        monthDiv.textContent = monthNames[i - 1];
        monthDiv.dataset.month = i;
        if (i === currentMonth) {
            monthDiv.classList.add('selected');
        }
        monthContainer.appendChild(monthDiv);
    }

    document.querySelectorAll('.month').forEach(month => {
        month.addEventListener('click', (e) => {
            currentMonth = parseInt(e.target.dataset.month);
            document.querySelector('.month.selected').classList.remove('selected');
            e.target.classList.add('selected');
            buildCalendar();
            centerSelectedMonth();
        });
    });
}

function buildCalendar() {
    calendarContainer.innerHTML = '';
    const date = new Date(currentYear, currentMonth - 1, 1);
    const firstDay = date.getDay(); // 0 (Sun) - 6 (Sat)
    const lastDate = new Date(currentYear, currentMonth, 0).getDate();

    const calendar = document.createElement('table');
    calendar.innerHTML = `
        <thead>
            <tr>
                <th>Sun</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Sat</th>
            </tr>
        </thead>
    `;

    let dateNum = 1;
    const tbody = document.createElement('tbody');
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            if (i === 0 && j < firstDay) {
                // Empty cells for previous month's dates
            } else if (dateNum > lastDate) {
                // Empty cells for next month's dates
            } else {
                cell.textContent = dateNum;
                // Highlight today's date
                if (currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth() + 1 && dateNum === new Date().getDate()) {
                    cell.classList.add('today');
                }
                dateNum++;
            }
            row.appendChild(cell);
        }
        tbody.appendChild(row);
        if (dateNum > lastDate) break; // Stop creating rows if all dates are placed
    }
    calendar.appendChild(tbody);
    calendarContainer.appendChild(calendar);
}

function centerSelectedMonth() {
    const selectedMonth = document.querySelector('.month.selected');
    if (selectedMonth) {
        selectedMonth.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

document.getElementById('prev-year').addEventListener('click', () => {
    currentYear--;
    yearElement.textContent = currentYear;
    buildCalendar();
});

document.getElementById('next-year').addEventListener('click', () => {
    currentYear++;
    yearElement.textContent = currentYear;
    buildCalendar();
});

// Initial setup
yearElement.textContent = currentYear;
buildMonthCarousel();
buildCalendar();
centerSelectedMonth();
