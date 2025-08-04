import { protectPage, db } from '../auth/auth.js';
import { collection, query, where, addDoc, getDocs, serverTimestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Element References ---
const prescriptionForm = document.getElementById('prescription-form');
const patientSelect = document.getElementById('patient-select');
const successMessageEl = document.getElementById('form-success-message');
const historyListEl = document.getElementById('history-list');
const historyLoadingEl = document.getElementById('history-loading');
const historyEmptyStateEl = document.getElementById('history-empty-state');

// --- State ---
let currentDoctor = null;

// --- Main Logic ---
protectPage((user, userData) => {
    if (userData.role !== 'doctor') {
        alert("Access Denied: This page is for doctors only.");
        window.location.href = '../patient/patient.html';
        return;
    }
    currentDoctor = { uid: user.uid, ...userData };
    loadPatients();
    loadPrescriptionHistory(user.uid);
});

// --- Load Patients into Dropdown ---
async function loadPatients() {
    try {
        const q = query(collection(db, "users"), where("role", "==", "patient"));
        const querySnapshot = await getDocs(q);
        
        patientSelect.innerHTML = '<option value="">Select a patient</option>';
        
        if (querySnapshot.empty) {
            patientSelect.innerHTML = '<option value="">No patients found</option>';
        } else {
            querySnapshot.forEach(doc => {
                const patient = { id: doc.id, ...doc.data() };
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = patient.fullName;
                option.dataset.patientName = patient.fullName;
                patientSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error loading patients: ", error);
        patientSelect.innerHTML = '<option value="">Error loading patients</option>';
    }
}

// --- Form Submission ---
prescriptionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    successMessageEl.style.display = 'none';

    const selectedOption = patientSelect.options[patientSelect.selectedIndex];
    
    const prescriptionData = {
        doctorId: currentDoctor.uid,
        doctorName: currentDoctor.fullName,
        patientId: selectedOption.value,
        patientName: selectedOption.dataset.patientName,
        medication: document.getElementById('medication-name').value,
        dosage: document.getElementById('dosage').value,
        frequency: document.getElementById('frequency').value,
        duration: document.getElementById('duration').value,
        notes: document.getElementById('notes').value,
        createdAt: serverTimestamp()
    };

    if (!prescriptionData.patientId) {
        alert("Please select a patient.");
        return;
    }

    try {
        await addDoc(collection(db, "prescriptions"), prescriptionData);
        successMessageEl.textContent = 'Prescription issued successfully!';
        successMessageEl.style.display = 'block';
        prescriptionForm.reset();
        loadPrescriptionHistory(currentDoctor.uid); // Refresh history
        setTimeout(() => successMessageEl.style.display = 'none', 4000);
    } catch (error) {
        console.error("Error issuing prescription: ", error);
        alert("Failed to issue prescription. Please try again.");
    }
});

// --- Load Prescription History ---
async function loadPrescriptionHistory(doctorId) {
    historyLoadingEl.style.display = 'block';
    historyListEl.innerHTML = '';
    historyEmptyStateEl.style.display = 'none';

    try {
        const q = query(
            collection(db, "prescriptions"),
            where("doctorId", "==", doctorId),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            historyEmptyStateEl.style.display = 'block';
        } else {
            querySnapshot.forEach(doc => {
                const pres = doc.data();
                const card = document.createElement('div');
                card.className = 'history-card';
                const date = pres.createdAt?.toDate().toLocaleDateString() || 'N/A';
                card.innerHTML = `
                    <div class="history-card-header">
                        <span class="patient-name">${pres.patientName}</span>
                        <span class="date">${date}</span>
                    </div>
                    <p class="medication">${pres.medication}</p>
                `;
                historyListEl.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Error loading prescription history: ", error);
    } finally {
        historyLoadingEl.style.display = 'none';
    }
}
