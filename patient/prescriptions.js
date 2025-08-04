import { protectPage } from '../auth/auth.js';
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
const prescriptionsListContainer = document.getElementById('prescriptions-list');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');

// --- Main Logic ---
protectPage((user, userData) => {
    if (userData.role !== 'patient') {
        alert("Access Denied: This page is for patients only.");
        window.location.href = '../doctor/dr2.html';
        return;
    }
    fetchPrescriptions(user.uid);
});

async function fetchPrescriptions(patientId) {
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    prescriptionsListContainer.innerHTML = ''; // Clear previous list
    prescriptionsListContainer.appendChild(loadingState);

    try {
        const prescriptionsRef = collection(db, "prescriptions");
        const q = query(
            prescriptionsRef, 
            where("patientId", "==", patientId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);

        loadingState.style.display = 'none';

        if (querySnapshot.empty) {
            emptyState.style.display = 'block';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const pres = doc.data();
            const card = document.createElement('div');
            card.className = 'prescription-card';
            
            const date = pres.createdAt?.toDate().toLocaleDateString('en-US', { dateStyle: 'long' }) || 'N/A';

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="medication">${pres.medication}</h3>
                    <span class="date">Issued on ${date}</span>
                </div>
                <div class="card-body">
                    <div class="detail-item">
                        <span class="label">Dosage</span>
                        <span class="value">${pres.dosage || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Frequency</span>
                        <span class="value">${pres.frequency || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Duration</span>
                        <span class="value">${pres.duration || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Prescribed by</span>
                        <span class="value">${pres.doctorName || 'N/A'}</span>
                    </div>
                </div>
                ${pres.notes ? `
                <div class="card-footer">
                    <div class="label">Doctor's Notes</div>
                    <p class="notes">${pres.notes}</p>
                </div>` : ''}
            `;
            prescriptionsListContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Error fetching prescriptions: ", error);
        loadingState.style.display = 'none';
        prescriptionsListContainer.innerHTML = '<p>Could not load prescriptions. Please try again later.</p>';
    }
}
