import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdk5v-gxcOEpgVLr8V6XU_WlZENYuZuXI",
  authDomain: "time-tracker-ai-53226.firebaseapp.com",
  databaseURL: "https://time-tracker-ai-53226-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "time-tracker-ai-53226",
  storageBucket: "time-tracker-ai-53226.firebasestorage.app",
  messagingSenderId: "815458766994",
  appId: "1:815458766994:web:780834254ff274532e164b",
  measurementId: "G-ZPQ6CBTTVC"
};
console.log("CONFIG_CHECK", firebaseConfig); 
//initialize firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {
  app,
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};
