import { protectPage } from '../auth/auth.js';
import { getFirestore, collection, query, where, addDoc, getDocs, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyBwzZRpu-scTnXDPuyqOAFFfyHKkzpt3BQ",
  authDomain: "telecare-af6d5.firebaseapp.com",
  projectId: "telecare-af6d5",
  storageBucket: "telecare-af6d5.firebasestorage.app",
  messagingSenderId: "738715171580",
  appId: "1:738715171580:web:20f0ddfc240564c0863579"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Element References ---
const healthDataForm = document.getElementById('health-data-form');
const entryDateInput = document.getElementById('entry-date');
const successMessageEl = document.getElementById('form-success-message');
const historyTableBody = document.getElementById('history-table-body');
const historyLoadingEl = document.getElementById('history-loading');
const historyEmptyStateEl = document.getElementById('history-empty-state');
const historyTableContainer = document.getElementById('history-table-container');
const bpChartCanvas = document.getElementById('bp-chart');
let bpChart = null; // To hold the chart instance

// --- Main Logic ---
protectPage((user, userData) => {
    if (userData.role !== 'patient') {
        alert("Access Denied: This page is for patients only.");
        window.location.href = '../doctor/dr2.html';
        return;
    }
    // Set default date to today
    entryDateInput.valueAsDate = new Date();
    // Fetch and display existing health data
    fetchHealthData(user.uid);
});

// --- Form Submission ---
healthDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    successMessageEl.textContent = '';

    const patientId = protectPage.currentUser.uid; // Assuming protectPage exposes the user
    const entryDate = new Date(entryDateInput.value);

    const data = {
        patientId: patientId,
        date: serverTimestamp(), // Use server time for consistency
        entryDate: entryDate, // Keep user's selected date for display
        bpSystolic: document.getElementById('bp-systolic').value,
        bpDiastolic: document.getElementById('bp-diastolic').value,
        heartRate: document.getElementById('heart-rate').value,
        bloodSugar: document.getElementById('blood-sugar').value,
        notes: document.getElementById('notes').value,
    };

    try {
        await addDoc(collection(db, "health_data"), data);
        successMessageEl.textContent = 'Entry saved successfully!';
        healthDataForm.reset();
        entryDateInput.valueAsDate = new Date(); // Reset date to today
        fetchHealthData(patientId); // Refresh data
        setTimeout(() => successMessageEl.textContent = '', 3000);
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to save entry. Please try again.");
    }
});

// --- Data Fetching and Display ---
async function fetchHealthData(patientId) {
    historyLoadingEl.style.display = 'block';
    historyTableContainer.style.display = 'none';
    historyEmptyStateEl.style.display = 'none';

    try {
        const q = query(
            collection(db, "health_data"),
            where("patientId", "==", patientId),
            orderBy("entryDate", "desc")
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            historyEmptyStateEl.style.display = 'block';
        } else {
            const healthData = querySnapshot.docs.map(doc => doc.data());
            renderHistoryTable(healthData);
            renderBloodPressureChart(healthData);
            historyTableContainer.style.display = 'block';
        }
    } catch (error) {
        console.error("Error fetching health data: ", error);
    } finally {
        historyLoadingEl.style.display = 'none';
    }
}

function renderHistoryTable(data) {
    historyTableBody.innerHTML = '';
    data.forEach(entry => {
        const row = document.createElement('tr');
        const entryDate = entry.entryDate.toDate();
        row.innerHTML = `
            <td>${entryDate.toLocaleDateString()}</td>
            <td>${entry.bpSystolic || '--'}/${entry.bpDiastolic || '--'}</td>
            <td>${entry.heartRate || '--'}</td>
            <td>${entry.bloodSugar || '--'}</td>
        `;
        historyTableBody.appendChild(row);
    });
}

function renderBloodPressureChart(data) {
    // Destroy previous chart instance if it exists
    if (bpChart) {
        bpChart.destroy();
    }

    // Reverse data to show oldest first on the chart
    const chartData = data.slice().reverse();

    bpChart = new Chart(bpChartCanvas, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.entryDate.toDate().toLocaleDateString()),
            datasets: [
                {
                    label: 'Systolic',
                    data: chartData.map(d => d.bpSystolic),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Diastolic',
                    data: chartData.map(d => d.bpDiastolic),
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Expose currentUser through a getter on the protectPage function
// This is a simple way to access it after authentication
protectPage.currentUser = null;
const originalProtectPage = protectPage;
window.protectPage = (callback) => {
    originalProtectPage((user, userData) => {
        protectPage.currentUser = user;
        callback(user, userData);
    });
};
