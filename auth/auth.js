// This is the central "brain" for your application.
// It exports all the tools other pages need.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// IMPORTANT: Make sure your Firebase config is correct here
const firebaseConfig = {
    apiKey: "AIzaSyBwzZRpu-scTnXDPuyqOAFFfyHKkzpt3BQ",
    authDomain: "telecare-af6d5.firebaseapp.com",
    projectId: "telecare-af6d5",
    storageBucket: "telecare-af6d5.appspot.com",
    messagingSenderId: "738715171580",
    appId: "1:738715171580:web:20f0ddfc240564c0863579"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const protectPage = (callback) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    callback(user, userDoc.data());
                } else {
                    console.error("No user data found for UID:", user.uid);
                    logout();
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                logout();
            }
        } else {
            console.log("User not authenticated. Redirecting to login.");
            window.location.href = '/auth/login.html';
        }
    });
};

const logout = () => {
    signOut(auth).then(() => {
        console.log("User signed out.");
        window.location.href = '/main/main.html';
    }).catch((error) => {
        console.error("Sign out error:", error);
    });
};

// This line exports all the necessary tools for other scripts.
export { auth, db, onAuthStateChanged, protectPage, logout, getDoc, doc };
