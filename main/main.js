// This file correctly imports from the central auth.js file.

import { auth, db, onAuthStateChanged, logout, getDoc, doc } from '../auth/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const authButtonsContainer = document.getElementById('authButtons');
    const getStartedBtn = document.getElementById('getStartedBtn');

    onAuthStateChanged(auth, async (user) => {
        authButtonsContainer.innerHTML = ''; 

        if (user) {
            // --- USER IS LOGGED IN ---
            console.log("User is logged in:", user.email);
            
            let dashboardUrl = '../patient/patient.html'; // Default URL

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().role === 'doctor') {
                    dashboardUrl = '../doctor/dr2.html';
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
            }

            const dashboardButton = document.createElement('button');
            dashboardButton.textContent = 'Go to Dashboard';
            dashboardButton.onclick = () => window.location.href = dashboardUrl;

            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Logout';
            logoutButton.className = 'btn-secondary';
            logoutButton.onclick = logout;

            authButtonsContainer.appendChild(dashboardButton);
            authButtonsContainer.appendChild(logoutButton);
            
            if (getStartedBtn) {
                getStartedBtn.onclick = () => window.location.href = dashboardUrl;
            }

        } else {
            // --- USER IS LOGGED OUT ---
            console.log("User is logged out.");

            const loginButton = document.createElement('button');
            loginButton.textContent = 'Login';
            loginButton.className = 'btn-secondary';
            loginButton.onclick = () => window.location.href = '../auth/login.html';

            const signupButton = document.createElement('button');
            signupButton.textContent = 'Sign Up';
            signupButton.onclick = () => window.location.href = '../sign_up/Sign_up.html';

            authButtonsContainer.appendChild(loginButton);
            authButtonsContainer.appendChild(signupButton);
            
             if (getStartedBtn) {
                // Typo corrected here from 'sign_ip' to 'sign_up'
                getStartedBtn.onclick = () => window.location.href = '../sign_up/Sign_up.html';
            }
        }
    });
});
