import { protectPage, logout } from '../auth/auth.js';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
const patientListBody = document.getElementById('patientList');
const logoutButton = document.getElementById('logout-btn');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const table = document.querySelector('.patients-table');

// --- Main Logic ---
protectPage(async (user, userData) => {
    if (userData.role !== 'doctor') {
        alert("Access Denied: This page is for doctors only.");
        window.location.href = '../patient/patient.html';
        return;
    }

    try {
        const appointmentsRef = collection(db, "appointments");
        const q = query(appointmentsRef, where("doctorId", "==", user.uid));
        const appointmentSnapshots = await getDocs(q);

        if (appointmentSnapshots.empty) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            table.style.display = 'none';
            return;
        }

        const patientPromises = appointmentSnapshots.docs.map(async (appointmentDoc) => {
            const appointmentData = appointmentDoc.data();
            const patientId = appointmentData.patientId;
            const patientDocRef = doc(db, "users", patientId);
            const patientDocSnap = await getDoc(patientDocRef);

            if (patientDocSnap.exists()) {
                return { ...appointmentData, ...patientDocSnap.data() };
            }
            return null;
        });

        const patientsData = (await Promise.all(patientPromises)).filter(p => p !== null);
        displayPatients(patientsData);

    } catch (error) {
        console.error("Error fetching patient list:", error);
        loadingState.innerHTML = "<p>Error loading data. Please try again later.</p>";
    }
});

function displayPatients(patients) {
    patientListBody.innerHTML = '';

    if (patients.length === 0) {
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
        table.style.display = 'none';
        return;
    }

    patients.forEach(patient => {
        const row = document.createElement('tr');
        const appointmentDate = patient.date.toDate ? patient.date.toDate() : new Date(patient.date);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        row.innerHTML = `
            <td data-label="Patient Name">${patient.fullName}</td>
            <td data-label="Age">${patient.age}</td>
            <td data-label="Gender">${patient.gender}</td>
            <td data-label="Date">${formattedDate}</td>
            <td data-label="Time">${formattedTime}</td>
            <td data-label="Status"><span class="status status-${patient.status.toLowerCase()}">${patient.status}</span></td>
        `;
        patientListBody.appendChild(row);
    });

    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
    table.style.display = 'table';
}

logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});
