import { protectPage, db } from '../auth/auth.js';
import { collection, query, where, getDocs, Timestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- State Management ---
let currentDate = new Date();
let appointments = [];

// --- Element References ---
const calendarGrid = document.querySelector('.calendar-grid');
const currentMonthYearEl = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const selectedDateDisplay = document.getElementById('selected-date-display');
const appointmentDetailsList = document.getElementById('appointment-details-list');

// --- Main Logic ---
protectPage(async (user, userData) => {
    if (userData.role !== 'doctor') {
        alert("Access Denied: This page is for doctors only.");
        window.location.href = '../patient/patient.html';
        return;
    }
    await fetchAppointments(user.uid);
    renderCalendar();
});

async function fetchAppointments(doctorId) {
    try {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

        const q = query(
            collection(db, "appointments"),
            where("doctorId", "==", doctorId),
            where("date", ">=", Timestamp.fromDate(startOfMonth)),
            where("date", "<=", Timestamp.fromDate(endOfMonth)),
            orderBy("date")
        );
        const querySnapshot = await getDocs(q);
        appointments = querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching appointments: ", error);
    }
}

function renderCalendar() {
    calendarGrid.innerHTML = `<div class="day-name">Sun</div><div class="day-name">Mon</div><div class="day-name">Tue</div><div class="day-name">Wed</div><div class="day-name">Thu</div><div class="day-name">Fri</div><div class="day-name">Sat</div>`;
    currentMonthYearEl.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarGrid.innerHTML += `<div class="calendar-day other-month"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        const dayDate = new Date(year, month, day);
        if (dayDate.toDateString() === new Date().toDateString()) dayEl.classList.add('today');

        dayEl.innerHTML = `<span class="day-number">${day}</span>`;
        
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events-container';
        const dayAppointments = appointments.filter(a => a.date.toDate().getDate() === day);
        dayAppointments.forEach(appt => {
            eventsContainer.innerHTML += `<div class="event-dot ${appt.status.toLowerCase()}"></div>`;
        });
        dayEl.appendChild(eventsContainer);

        dayEl.addEventListener('click', () => {
            document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
            dayEl.classList.add('selected');
            displayAppointmentDetails(dayDate, dayAppointments);
        });
        calendarGrid.appendChild(dayEl);
    }
}

function displayAppointmentDetails(date, dayAppointments) {
    selectedDateDisplay.textContent = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    appointmentDetailsList.innerHTML = '';
    if (dayAppointments.length === 0) {
        appointmentDetailsList.innerHTML = `<div class="no-appointments-message"><p>No appointments on this day.</p></div>`;
        return;
    }
    dayAppointments.forEach(appt => {
        const time = appt.date.toDate().toLocaleTimeString('en-US', { timeStyle: 'short' });
        appointmentDetailsList.innerHTML += `<div class="appointment-card ${appt.status.toLowerCase()}"><p class="appointment-time">${time}</p><p class="appointment-patient">${appt.patientName}</p></div>`;
    });
}

prevMonthBtn.addEventListener('click', async () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    await protectPage(async (user) => await fetchAppointments(user.uid));
    renderCalendar();
});

nextMonthBtn.addEventListener('click', async () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    await protectPage(async (user) => await fetchAppointments(user.uid));
    renderCalendar();
});
