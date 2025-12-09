# 🕒 AI-Powered Daily Time Tracking & Analytics Dashboard

A web application that helps users log daily activities (in minutes) and analyse how their **24 hours (1440 minutes)** are spent with a clean, visual dashboard.

Built with **vanilla JavaScript**, **Firebase Auth + Firestore**, and **Chart.js**, with UI/UX and code assisted by **AI tools**.

---

## 🚀 Live Demo

**Deployed Link:** `https://manpoordivyasree26-glitch.github.io/time-tracker-ai/`

---

## 🎥 Video Walkthrough

- **Video Link:** `<YouTube or Google Drive link>`
- In the video, I show:
  - Login & authentication flow
  - Adding/editing/deleting activities
  - 24-hour (1440 min) validation and remaining time
  - Date-based analytics dashboard
  - “No data available” state
  - How I used AI tools while building the project

---

## 🧠 How I Used AI

- Used **ChatGPT** to:
  - Brainstorm the UI layout and color palette
  - Generate initial HTML, CSS, and JS structure
  - Help design the analytics dashboard and choose Chart.js
  - Draft this README structure
- Iterated on code with AI suggestions (e.g., validation logic, Firestore structure, and responsive layout).

---

## 🧱 Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript (ES Modules)
- **Backend & Auth:** Firebase
  - Firebase Authentication (Email/Password, Google)
  - Firestore (per-user daily activities)
- **Charts & Analytics:** Chart.js
- **Deployment:** GitHub Pages
- **Version Control:** Git + GitHub

---

## ✨ Features

### Authentication

- Firebase Authentication:
  - Email/Password (auto login or auto create account)
  - Google Sign-In
- Only authenticated users can:
  - Log activities
  - View & analyse dashboard
- Non-logged-in users see only landing/login page.

### Activity Logging

- User selects a date using a date picker.
- For each date, user can add multiple activities:
  - Activity name
  - Category (Work, Study, Sleep, Exercise, Entertainment, etc.)
  - Duration in minutes
- Validations:
  - Total minutes per day **≤ 1440**
  - Remaining minutes are shown:
    - e.g. “You have 180 minutes left for this day”
- Users can:
  - Add activities
  - Edit existing activities (with validation)
  - Delete activities

### Data Storage

- Firestore structure:

  ```text
  users/{userId}/days/{dateString}/activities/{activityId}

