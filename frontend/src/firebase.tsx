// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFj7W3uz8G40ilwYA1zxPN8cX71Q7G45s",
  authDomain: "ai-dvisor-466322.firebaseapp.com",
  projectId: "ai-dvisor-466322",
  storageBucket: "ai-dvisor-466322.firebasestorage.app",
  messagingSenderId: "75390045716",
  appId: "1:75390045716:web:72dc1c8be1375a8be02101",
  measurementId: "G-TK4686KBSS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);