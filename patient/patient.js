// Import the shared functions from our central auth module
import { protectPage, logout } from '../auth/auth.js';

// Get references to the HTML elements we need to update
const userNameElement = document.getElementById('user-name');
const userRoleElement = document.getElementById('user-role');
const logoutButton = document.getElementById('logout-btn');

// --- Main Logic ---

// 1. Protect the page.
// The code inside this function will only run if the user is logged in.
protectPage((user, userData) => {
    // This block runs after the user is confirmed to be logged in.
    // 'user' is the Firebase Auth object (user.email, user.uid, etc.)
    // 'userData' is the data from our Firestore 'users' collection (userData.fullName, userData.role, etc.)
    
    console.log("Patient dashboard accessed by:", user.email);
    console.log("User data:", userData);

    // 2. Populate the dashboard with user-specific data.
    if (userData) {
        userNameElement.textContent = userData.fullName || 'No Name';
        // Capitalize the first letter of the role for display
        userRoleElement.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);

        // If the user is not a patient, redirect them away.
        // This prevents a doctor from seeing the patient dashboard.
        if (userData.role !== 'patient') {
            alert("Access denied. Redirecting to your dashboard.");
            window.location.href = '../doctor/dr2.html'; // Or a generic access-denied page
        }

        // TODO: Populate other dynamic fields like health metrics and appointments
        // For now, we'll just put some placeholder text.
        document.getElementById('health-bpm').textContent = '72';
        document.getElementById('health-bp').textContent = '120/80';
        document.getElementById('health-spo2').textContent = '98%';

    } else {
        // This is a fallback, though protectPage should handle it.
        userNameElement.textContent = 'Error';
        userRoleElement.textContent = 'Could not load data';
    }
});

// 3. Add event listener for the logout button.
logoutButton.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the link from navigating
    logout(); // Call the logout function from our auth module
});
