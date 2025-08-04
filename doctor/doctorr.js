import { protectPage, logout } from '../auth/auth.js';
import { getFirestore, collection, query, where, getDocs, Timestamp, orderBy, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyBwzZRpu-scTnXDPuyqOAFFfyHKkzpt3BQ",
  authDomain: "telecare-af6d5.firebaseapp.com",
  projectId: "telecare-af6d5",
  storageBucket: "telecare-af6d5.firebasestorage.app",
  messagingSenderId: "738715171580",
  appId: "1:738715171580:web:20f0ddfc240564c0863579"
};

// Initialize Firebase App, but only if it hasn't been initialized already
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // Use the existing app
}
const db = getFirestore(app);

// --- Element References ---
const doctorNameElement = document.getElementById('doctor-name');
const doctorSpecializationElement = document.getElementById('doctor-specialization');
const logoutButton = document.getElementById('logout-btn');
const appointmentsListContainer = document.getElementById('appointments-list');

// --- Main Logic ---
protectPage((user, userData) => {
    if (userData.role !== 'doctor') {
        alert("Access Denied: This page is for doctors only.");
        window.location.href = '../patient/patient.html'; 
        return;
    }

    // 1. Populate sidebar with doctor's info
    doctorNameElement.textContent = `Dr. ${userData.fullName}` || 'Dr. Name';
    doctorSpecializationElement.textContent = userData.specialization || 'Specialization';

    // 2. Fetch today's appointments
    fetchTodaysAppointments(user.uid);
});

// --- Fetch and Display Appointments ---
async function fetchTodaysAppointments(doctorId) {
    appointmentsListContainer.innerHTML = `<p>Loading appointments...</p>`;

    // Get the start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
        const q = query(
            collection(db, "appointments"),
            where("doctorId", "==", doctorId),
            where("date", ">=", Timestamp.fromDate(today)),
            where("date", "<", Timestamp.fromDate(tomorrow)),
            orderBy("date")
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            appointmentsListContainer.innerHTML = `<p>No appointments scheduled for today.</p>`;
            return;
        }

        appointmentsListContainer.innerHTML = ''; // Clear loading message
        querySnapshot.forEach(doc => {
            const appt = doc.data();
            const apptDate = appt.date.toDate();
            const time = apptDate.toLocaleTimeString('en-US', { timeStyle: 'short' });

            const row = document.createElement('div');
            row.className = 'timeline-row';
            row.innerHTML = `
                <div class="time-cell">${time}</div>
                <div class="patient-cell">
                    <div class="patient-avatar">
                        <img src="https://placehold.co/50x50/FFE4E6/991B1B?text=${appt.patientName.charAt(0)}" alt="${appt.patientName}" />
                    </div>
                    <div class="patient-info">
                        <h4>${appt.patientName}</h4>
                        <p>${appt.symptoms || 'Follow-up'}</p>
                    </div>
                </div>
                <div class="status-cell">
                    <span class="badge ${appt.status.toLowerCase()}">${appt.status}</span>
                </div>
                <div class="action-cell">
                    <a href="../consult/video-call.html?id=${doc.id}" class="btn btn-primary btn-sm">Start</a>
                </div>
            `;
            appointmentsListContainer.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching appointments: ", error);
        appointmentsListContainer.innerHTML = `<p>Error loading appointments.</p>`;
    }
}

// --- Event Listeners ---
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});
