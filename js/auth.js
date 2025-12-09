// auth.js
import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "./firebaseConfig.js";
import { setCurrentUser } from "./tracker.js";

const authSection = document.getElementById("auth-section");
const trackerSection = document.getElementById("tracker-section");
const navUserEmail = document.getElementById("nav-user-email");
const logoutBtn = document.getElementById("logout-btn");

const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const googleLoginBtn = document.getElementById("google-login-btn");
const authError = document.getElementById("auth-error");

function showError(msg) {
  authError.textContent = msg;
  authError.classList.remove("hidden");
}

function clearError() {
  authError.textContent = "";
  authError.classList.add("hidden");
}

// Email/password login or signup (auto)
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showError("Please enter email and password.");
    return;
  }

  try {
    // Try sign in
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("LOGIN ERROR:", error.code, error.message);

    // Treat both "user-not-found" and "invalid-credential" as "no account yet"
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-credential"
    ) {
      try {
        // Auto-create account if sign in fails
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (createError) {
        console.error(
          "SIGNUP ERROR:",
          createError.code,
          createError.message
        );
        showError(
          "Could not create account. " + (createError.message || "")
        );
      }
    } else {
      showError("Login failed. " + (error.message || ""));
    }
  }
});

// Google login
googleLoginBtn.addEventListener("click", async () => {
  clearError();
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    showError("Google sign-in failed.");
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Logged in
    authSection.classList.add("hidden");
    trackerSection.classList.remove("hidden");

    navUserEmail.textContent = user.email || "Logged in";
    navUserEmail.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");

    setCurrentUser(user); // tell tracker module
  } else {
    // Logged out
    authSection.classList.remove("hidden");
    trackerSection.classList.add("hidden");

    navUserEmail.textContent = "";
    navUserEmail.classList.add("hidden");
    logoutBtn.classList.add("hidden");

    setCurrentUser(null);
  }
});
