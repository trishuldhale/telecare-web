import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// IMPORTANT: Replace with your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwzZRpu-scTnXDPuyqOAFFfyHKkzpt3BQ",
  authDomain: "telecare-af6d5.firebaseapp.com",
  projectId: "telecare-af6d5",
  storageBucket: "telecare-af6d5.firebasestorage.app",
  messagingSenderId: "738715171580",
  appId: "1:738715171580:web:20f0ddfc240564c0863579"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Element References ---
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageElement = document.getElementById('message');

// --- Form Submission Logic ---
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  messageElement.textContent = '';
  messageElement.className = 'message'; // Reset class

  const email = emailInput.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("Login successful for:", user.email);

      // Show a success message
      messageElement.textContent = 'Login Successful! Redirecting...';
      messageElement.classList.add('success');

      // --- START OF FIX ---
      // Wait briefly before redirecting to the main page
      setTimeout(() => {
        window.location.href = '../main/main.html';
      }, 1500);
      // --- END OF FIX ---
      
    })
    .catch((error) => {
      console.error("Login failed:", error.code, error.message);
      let friendlyMessage = "Invalid email or password. Please try again.";
      if (error.code === 'auth/too-many-requests') {
          friendlyMessage = "Access to this account has been temporarily disabled.";
      }
      messageElement.textContent = friendlyMessage;
    });
});
