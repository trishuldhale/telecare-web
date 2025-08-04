// Import functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const signupForm = document.getElementById('signup-form');
const userTypeRadios = document.querySelectorAll('input[name="userType"]');
const patientOnlyFields = document.querySelectorAll('.patient-only');
const doctorOnlyFields = document.querySelectorAll('.doctor-only');
const errorMessageElement = document.getElementById('signup-error');

// --- Event Listeners ---

// 1. Toggle visibility of role-specific fields
userTypeRadios.forEach(radio => {
  radio.addEventListener('change', (event) => {
    const isPatient = event.target.value === 'patient';
    patientOnlyFields.forEach(field => field.style.display = isPatient ? 'block' : 'none');
    doctorOnlyFields.forEach(field => field.style.display = isPatient ? 'none' : 'block');
  });
});

// 2. Handle form submission
signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorMessageElement.textContent = '';

  // Get form data
  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const userType = document.querySelector('input[name="userType"]:checked').value;

  // Basic validation
  if (!fullName || !email || !password) {
    errorMessageElement.textContent = 'Please fill in all required fields.';
    return;
  }
  if (password.length < 6) {
    errorMessageElement.textContent = 'Password must be at least 6 characters long.';
    return;
  }

  try {
    // Step 1: Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('User created in Auth:', user.uid);

    // Step 2: Prepare user data for Firestore
    const userData = {
      uid: user.uid,
      email: user.email,
      fullName: fullName,
      role: userType,
      createdAt: new Date() // Timestamp for when the account was created
    };

    // Add role-specific data
    if (userType === 'patient') {
      userData.age = document.getElementById('age').value;
      userData.gender = document.getElementById('gender').value;
    } else { // 'doctor'
      userData.medicalLicense = document.getElementById('medicalLicense').value;
      userData.specialization = document.getElementById('specialization').value;
    }

    // Step 3: Save user data to Firestore
    // We use the user's UID as the document ID in the 'users' collection
    await setDoc(doc(db, "users", user.uid), userData);
    console.log('User data saved to Firestore');

    // Step 4: Redirect to the correct dashboard
    alert('Account created successfully!');
    if (userType === 'patient') {
      window.location.href = '../patient/patient.html';
    } else {
      window.location.href = '../doctor/dr2.html'; // Assuming this is the doctor dashboard
    }

  } catch (error) {
    // Handle errors
    console.error("Signup failed:", error.code, error.message);
    let friendlyMessage = "An unexpected error occurred. Please try again.";
    switch (error.code) {
      case 'auth/email-already-in-use':
        friendlyMessage = "This email address is already in use by another account.";
        break;
      case 'auth/invalid-email':
        friendlyMessage = "Please enter a valid email address.";
        break;
      case 'auth/weak-password':
        friendlyMessage = "The password is too weak. Please use at least 6 characters.";
        break;
    }
    errorMessageElement.textContent = friendlyMessage;
  }
});
