import { protectPage, db } from '../auth/auth.js';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Element References ---
const appointmentsListContainer = document.getElementById('appointments-list');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const cancelModal = document.getElementById('cancel-modal');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const closeModalBtns = [document.getElementById('close-cancel-modal'), document.getElementById('dont-cancel-btn')];
let appointmentToCancelId = null;

// --- Main Logic ---
protectPage((user, userData) => {
    if (userData.role !== 'patient') {
        alert("Access Denied: This page is for patients only.");
        window.location.href = '../doctor/dr2.html';
        return;
    }
    fetchAppointments(user.uid);
});

async function fetchAppointments(patientId) {
    loadingState.style.display = 'block';
    emptyState.style.display = 'none';
    appointmentsListContainer.innerHTML = ''; // Clear previous list
    appointmentsListContainer.appendChild(loadingState); // Re-add loading state

    try {
        const appointmentsRef = collection(db, "appointments");
        // Query for appointments for the current patient, ordered by date
        const q = query(appointmentsRef, where("patientId", "==", patientId), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        const appointments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAppointments(appointments);

    } catch (error) {
        console.error("Error fetching appointments: ", error);
        loadingState.innerHTML = '<p>Could not load appointments. Please try again later.</p>';
    }
}

function renderAppointments(appointments) {
    loadingState.style.display = 'none';
    appointmentsListContainer.innerHTML = ''; // Clear loading/empty state

    appointments.forEach(appt => {
        const appointmentDate = appt.date.toDate();
        const isUpcoming = appointmentDate > new Date() && appt.status === 'Confirmed';
        
        const card = document.createElement('div');
        card.className = 'appointment-item';
        card.innerHTML = `
            <div class="appointment-header">
                <div class="appointment-doctor">
                    <div class="appointment-avatar">
                        <img src="https://placehold.co/50x50/E0E7FF/1E3A8A?text=${appt.doctorName.charAt(3)}" alt="${appt.doctorName}">
                    </div>
                    <div class="appointment-meta">
                        <div class="appointment-name">${appt.doctorName}</div>
                        <div class="appointment-specialty">${appt.doctorSpecialty || ''}</div>
                    </div>
                </div>
                <div class="appointment-status status-${appt.status.toLowerCase()}">${appt.status}</div>
            </div>
            <div class="appointment-details">
                <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${appointmentDate.toLocaleDateString('en-US', { dateStyle: 'full' })}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${appointmentDate.toLocaleTimeString('en-US', { timeStyle: 'short' })}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Reason</div>
                    <div class="detail-value">${appt.symptoms || 'Not specified'}</div>
                </div>
                ${isUpcoming ? `
                <div class="appointment-actions">
                    <button class="btn btn-outline btn-danger-outline cancel-btn" data-id="${appt.id}">Cancel</button>
                    <a href="../consult/consult.html?id=${appt.id}" class="btn btn-primary join-btn">Join Call</a>
                </div>` : ''}
            </div>
        `;
        appointmentsListContainer.appendChild(card);
    });

    // Add event listeners to the new cancel buttons
    document.querySelectorAll('.cancel-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            appointmentToCancelId = e.target.dataset.id;
            // You can add more details to the modal if needed
            cancelModal.classList.add('active');
        });
    });
}

// --- Modal and Cancellation Logic ---
async function cancelAppointment() {
    if (!appointmentToCancelId) return;

    try {
        const appointmentRef = doc(db, "appointments", appointmentToCancelId);
        await updateDoc(appointmentRef, {
            status: "Cancelled"
        });
        
        // Refresh the list to show the change
        protectPage((user) => fetchAppointments(user.uid));
        closeModal();
        
    } catch (error) {
        console.error("Error cancelling appointment: ", error);
        alert("Failed to cancel appointment. Please try again.");
    }
}

function closeModal() {
    cancelModal.classList.remove('active');
    appointmentToCancelId = null;
}

// --- Event Listeners ---
confirmCancelBtn.addEventListener('click', cancelAppointment);
closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
