import { protectPage } from '../auth/auth.js';
// --- START OF FIX ---
// We now import the 'db' connection from the central auth.js file
import { db } from '../auth/auth.js'; 
import { collection, query, where, getDocs, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// --- END OF FIX ---

// --- State Management ---
let currentPatient = null;
let selectedDoctor = null;
let selectedDate = null;
let selectedTime = null;
let currentDate = new Date();

// --- Element References ---
const steps = document.querySelectorAll('.appointment-step');
const doctorListContainer = document.getElementById('doctor-list');
const doctorListLoading = document.getElementById('doctor-list-loading');
const calendarBody = document.getElementById('calendar-body');
const currentMonthEl = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const timeSlotsContainer = document.getElementById('time-slots');
const backToDoctorsBtn = document.getElementById('back-to-doctors');
const backToTimeBtn = document.getElementById('back-to-time');
const appointmentForm = document.getElementById('appointment-form');
const confirmationModal = document.getElementById('confirmation-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// --- Main Logic ---
protectPage((user, userData) => {
    if (userData.role !== 'patient') {
        alert("Access Denied: Only patients can book appointments.");
        window.location.href = '../doctor/dr2.html';
        return;
    }
    currentPatient = { uid: user.uid, ...userData };
    fetchDoctors();
});

// --- Step Navigation ---
function goToStep(stepNumber) {
    steps.forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
}

// --- Step 1: Fetch and Display Doctors ---
async function fetchDoctors() {
    doctorListLoading.style.display = 'block';
    doctorListContainer.innerHTML = '';
    try {
        const q = query(collection(db, "users"), where("role", "==", "doctor"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const doctor = { id: doc.id, ...doc.data() };
            const doctorCard = document.createElement('div');
            doctorCard.className = 'doctor-card';
            doctorCard.dataset.doctorId = doctor.id;
            doctorCard.innerHTML = `
                <div class="doctor-info">
                    <div class="doctor-avatar">
                        <img src="https://placehold.co/60x60/E0E7FF/1E3A8A?text=${doctor.fullName.charAt(0)}" alt="${doctor.fullName}">
                    </div>
                    <div>
                        <div class="doctor-name">Dr. ${doctor.fullName}</div>
                        <div class="doctor-specialty">${doctor.specialization}</div>
                    </div>
                </div>`;
            doctorCard.addEventListener('click', () => selectDoctor(doctor, doctorCard));
            doctorListContainer.appendChild(doctorCard);
        });
    } catch (error) {
        console.error("Error fetching doctors: ", error);
        doctorListContainer.innerHTML = '<p>Could not load doctors. Please try again later.</p>';
    } finally {
        doctorListLoading.style.display = 'none';
    }
}

function selectDoctor(doctor, card) {
    document.querySelectorAll('.doctor-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedDoctor = doctor;
    renderCalendar();
    goToStep(2);
}

// --- Step 2: Calendar and Time Slots ---
function renderCalendar() {
    calendarBody.innerHTML = '';
    currentMonthEl.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarBody.innerHTML += `<div class="calendar-day other-month"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        const today = new Date();
        today.setHours(0,0,0,0);
        const thisDate = new Date(year, month, day);

        if (thisDate < today) {
            dayEl.classList.add('disabled');
        } else {
            dayEl.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayEl.classList.add('selected');
                selectedDate = thisDate;
                renderTimeSlots();
            });
        }
        calendarBody.appendChild(dayEl);
    }
}

function renderTimeSlots() {
    timeSlotsContainer.innerHTML = '';
    const slots = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"];
    slots.forEach(time => {
        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot';
        slotEl.textContent = time;
        slotEl.addEventListener('click', () => {
             document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
             slotEl.classList.add('selected');
             selectedTime = time;
             prepareConfirmation();
             goToStep(3);
        });
        timeSlotsContainer.appendChild(slotEl);
    });
}

prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// --- Step 3: Confirmation and Submission ---
function prepareConfirmation() {
    document.getElementById('selected-doctor-display').innerHTML = `
        <div class="doctor-name">Dr. ${selectedDoctor.fullName}</div>
        <div class="doctor-specialty">${selectedDoctor.specialization}</div>`;
    document.getElementById('selected-time-display').textContent = 
        `${selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${selectedTime}`;
}

appointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const symptoms = document.getElementById('symptoms').value;
    if (!selectedDoctor || !selectedDate || !selectedTime) {
        alert("Something went wrong. Please start over.");
        return;
    }

    const [time, period] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const finalAppointmentDate = new Date(selectedDate);
    finalAppointmentDate.setHours(hours, minutes, 0, 0);

    try {
        await addDoc(collection(db, "appointments"), {
            patientId: currentPatient.uid,
            doctorId: selectedDoctor.id,
            patientName: currentPatient.fullName,
            doctorName: selectedDoctor.fullName,
            date: Timestamp.fromDate(finalAppointmentDate),
            symptoms: symptoms,
            status: "Confirmed"
        });
        showConfirmationModal(finalAppointmentDate);
    } catch (error) {
        console.error("Error booking appointment: ", error);
        alert("Could not book appointment. Please try again.");
    }
});

// --- Modal Logic ---
function showConfirmationModal(date) {
    document.getElementById('confirmation-details').innerHTML = `
        <div class="confirmation-item">
            <div class="confirmation-label">Doctor</div>
            <div class="confirmation-value">Dr. ${selectedDoctor.fullName} (${selectedDoctor.specialization})</div>
        </div>
        <div class="confirmation-item">
            <div class="confirmation-label">Date & Time</div>
            <div class="confirmation-value">${date.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</div>
        </div>`;
    confirmationModal.classList.add('active');
}

closeModalBtn.addEventListener('click', () => confirmationModal.classList.remove('active'));

// --- Back Button Logic ---
backToDoctorsBtn.addEventListener('click', () => goToStep(1));
backToTimeBtn.addEventListener('click', () => goToStep(2));
