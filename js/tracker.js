// js/tracker.js
// Vanilla JS – CRUD with your Realtime DB URL using fetch + LocalStorage

// ✅ YOUR REALTIME DATABASE LINK (no .json at the end)
const BASE_URL =
  "https://time-tracker-ai-53226-default-rtdb.asia-southeast1.firebasedatabase.app/time";

let currentUserId = null;
let currentDateStr = null;
let activities = [];

let pieChartInstance = null;
let barChartInstance = null;

// DOM
const datePicker = document.getElementById("date-picker");
const listDateLabel = document.getElementById("list-date-label");

const totalMinutesText = document.getElementById("total-minutes-text");
const remainingMinutesText = document.getElementById("remaining-minutes-text");
const analyseBtn = document.getElementById("analyse-btn");
const trackerError = document.getElementById("tracker-error");

const activityForm = document.getElementById("activity-form");
const activityNameInput = document.getElementById("activity-name");
const activityCategorySelect = document.getElementById("activity-category");
const activityDurationInput = document.getElementById("activity-duration");

const activitiesEmpty = document.getElementById("activities-empty");
const activitiesList = document.getElementById("activities-list");

const noDataView = document.getElementById("no-data-view");
const dashboardContent = document.getElementById("dashboard-content");

const statTotalHours = document.getElementById("stat-total-hours");
const statActivityCount = document.getElementById("stat-activity-count");
const statTopCategory = document.getElementById("stat-top-category");
const timelineList = document.getElementById("timeline-list");

/* ---------- LocalStorage helpers ---------- */

function getLocalStorageKey() {
  if (!currentUserId || !currentDateStr) return null;
  return `TT_AI_${currentUserId}_${currentDateStr}`;
}

function saveToLocalStorage() {
  const key = getLocalStorageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(activities));
  console.log("Saved to localStorage:", key, activities);
}

function loadFromLocalStorage() {
  const key = getLocalStorageKey();
  if (!key) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    console.log("Loaded from localStorage:", key, parsed);
    return parsed;
  } catch (e) {
    console.error("Failed to parse localStorage data", e);
    return null;
  }
}

/* ---------- Helpers ---------- */

function showTrackerError(msg) {
  trackerError.textContent = msg;
  trackerError.classList.remove("hidden");
}

function clearTrackerError() {
  trackerError.textContent = "";
  trackerError.classList.add("hidden");
}

// Called from auth.js
export function setCurrentUser(user) {
  currentUserId = user ? user.uid : null;

  if (user) {
    if (!datePicker.value) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      datePicker.value = `${yyyy}-${mm}-${dd}`;
    }
    currentDateStr = datePicker.value;
    listDateLabel.textContent = currentDateStr;
    loadActivitiesForCurrentUserAndDate();
  } else {
    activities = [];
    renderActivities();
    resetDashboard();
  }
}

// Build RTDB path: timetracker/users/{uid}/days/{date}/activities
function getDayActivitiesUrl() {
  if (!currentUserId || !currentDateStr) return null;
  return `${BASE_URL}/timetracker/users/${currentUserId}/days/${currentDateStr}/activities`;
}

/* ---------- LOAD (READ) ---------- */

async function loadActivitiesForCurrentUserAndDate() {
  clearTrackerError();
  activities = [];
  renderActivities();

  if (!currentUserId || !currentDateStr) return;

  // 1) LocalStorage first
  const localData = loadFromLocalStorage();
  if (localData) {
    activities = localData;
    renderActivities();
  }

  // 2) Firebase
  try {
    const url = `${getDayActivitiesUrl()}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");

    const data = await res.json();

    if (!data) {
      activities = [];
    } else {
      activities = Object.keys(data).map((id) => ({
        id,
        ...data[id],
      }));
    }

    console.log("Loaded from Firebase:", activities);
    renderActivities();
    saveToLocalStorage();
  } catch (error) {
    console.error(error);
    showTrackerError("Failed to load activities for this date.");
  }
}

/* ---------- Summary ---------- */

function getTotalMinutes() {
  return activities.reduce((sum, a) => sum + Number(a.duration || 0), 0);
}

function updateSummaryUI() {
  const total = getTotalMinutes();
  const remaining = 1440 - total;

  totalMinutesText.textContent = `${total} min`;
  remainingMinutesText.textContent = `${remaining} min`;
  remainingMinutesText.classList.toggle("positive", remaining >= 0);

  analyseBtn.disabled = total <= 0;
}

/* ---------- Render list ---------- */

function renderActivities() {
  updateSummaryUI();

  if (activities.length === 0) {
    activitiesEmpty.classList.remove("hidden");
  } else {
    activitiesEmpty.classList.add("hidden");
  }

  activitiesList.innerHTML = "";

  activities.forEach((act) => {
    const li = document.createElement("li");
    li.className = "activity-item";
    li.dataset.id = act.id;

    const main = document.createElement("div");
    main.className = "activity-main";

    const nameEl = document.createElement("span");
    nameEl.className = "activity-name";
    nameEl.textContent = act.name;

    const meta = document.createElement("span");
    meta.className = "activity-meta";
    meta.textContent = `${act.category || "No category"}`;

    main.appendChild(nameEl);
    main.appendChild(meta);

    const durationEl = document.createElement("span");
    durationEl.className = "activity-duration";
    durationEl.textContent = `${act.duration} min`;

    const actions = document.createElement("div");
    actions.className = "activity-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-outline";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => handleEditActivity(act.id));

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-outline";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => handleDeleteActivity(act.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(main);
    li.appendChild(durationEl);
    li.appendChild(actions);

    activitiesList.appendChild(li);
  });
}

/* ---------- CREATE (ADD) ---------- */

activityForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearTrackerError();

  if (!currentUserId || !currentDateStr) {
    showTrackerError("You must be logged in to add activities.");
    return;
  }

  const name = activityNameInput.value.trim();
  const category = activityCategorySelect.value;
  const duration = Number(activityDurationInput.value);

  if (!name || !duration || duration <= 0) {
    showTrackerError("Please provide a valid activity and duration.");
    return;
  }

  const currentTotal = getTotalMinutes();
  if (currentTotal + duration > 1440) {
    showTrackerError("Total minutes cannot exceed 1440.");
    return;
  }

  try {
    const url = `${getDayActivitiesUrl()}.json`;
    const body = {
      name,
      category,
      duration,
      createdAt: Date.now(),
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed to add");

    const data = await res.json(); // { name: "-Nxyz123" }
    const id = data.name;

    activities.push({
      id,
      ...body,
    });

    renderActivities();
    saveToLocalStorage();
    console.log("After ADD:", activities);

    activityNameInput.value = "";
    activityDurationInput.value = "";
  } catch (error) {
    console.error(error);
    showTrackerError("Failed to add activity.");
  }
});

/* ---------- DELETE ---------- */

async function handleDeleteActivity(id) {
  clearTrackerError();
  if (!currentUserId || !currentDateStr) return;

  if (!window.confirm("Delete this activity?")) return;

  try {
    const url = `${getDayActivitiesUrl()}/${id}.json`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");

    activities = activities.filter((a) => a.id !== id);
    renderActivities();
    saveToLocalStorage();
    console.log("After DELETE:", activities);
  } catch (error) {
    console.error(error);
    showTrackerError("Failed to delete activity.");
  }
}

/* ---------- UPDATE (EDIT) ---------- */

async function handleEditActivity(id) {
  clearTrackerError();
  if (!currentUserId || !currentDateStr) return;

  const act = activities.find((a) => a.id === id);
  if (!act) return;

  const newName = window.prompt("Edit activity name:", act.name);
  if (newName === null) return;

  const newDurationStr = window.prompt(
    "Edit duration in minutes:",
    String(act.duration)
  );
  if (newDurationStr === null) return;

  const newDuration = Number(newDurationStr);

  if (!newName.trim() || !newDuration || newDuration <= 0) {
    showTrackerError("Invalid name or duration.");
    return;
  }

  const currentTotal = getTotalMinutes();
  const totalIfUpdated = currentTotal - Number(act.duration) + newDuration;
  if (totalIfUpdated > 1440) {
    showTrackerError("Total minutes cannot exceed 1440 after editing.");
    return;
  }

  try {
    const url = `${getDayActivitiesUrl()}/${id}.json`;
    const body = {
      name: newName.trim(),
      duration: newDuration,
    };

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed to update");

    act.name = newName.trim();
    act.duration = newDuration;
    renderActivities();
    saveToLocalStorage();
    console.log("After EDIT:", activities);
  } catch (error) {
    console.error(error);
    showTrackerError("Failed to update activity.");
  }
}

/* ---------- DATE CHANGE ---------- */

datePicker.addEventListener("change", () => {
  currentDateStr = datePicker.value;
  listDateLabel.textContent = currentDateStr || "";
  activities = [];
  renderActivities();
  resetDashboard();

  if (currentUserId && currentDateStr) {
    loadActivitiesForCurrentUserAndDate();
  }
});

/* ---------- ANALYTICS ---------- */

analyseBtn.addEventListener("click", () => {
  clearTrackerError();
  if (activities.length === 0) {
    showNoDataView();
    return;
  }
  showDashboardWithData();
});

function resetDashboard() {
  noDataView.classList.remove("hidden");
  dashboardContent.classList.add("hidden");
  if (pieChartInstance) {
    pieChartInstance.destroy();
    pieChartInstance = null;
  }
  if (barChartInstance) {
    barChartInstance.destroy();
    barChartInstance = null;
  }
  statTotalHours.textContent = "0 h";
  statActivityCount.textContent = "0";
  statTopCategory.textContent = "–";
  timelineList.innerHTML = "";
}

function showNoDataView() {
  noDataView.classList.remove("hidden");
  dashboardContent.classList.add("hidden");
}

function showDashboardWithData() {
  noDataView.classList.add("hidden");
  dashboardContent.classList.remove("hidden");

  const totalMinutes = getTotalMinutes();
  const totalHours = (totalMinutes / 60).toFixed(1);
  statTotalHours.textContent = `${totalHours} h`;
  statActivityCount.textContent = String(activities.length);

  const categoryTotals = {};
  activities.forEach((a) => {
    const key = a.category || "Other";
    if (!categoryTotals[key]) categoryTotals[key] = 0;
    categoryTotals[key] += Number(a.duration || 0);
  });

  let topCat = "–";
  let topValue = 0;
  for (const [cat, mins] of Object.entries(categoryTotals)) {
    if (mins > topValue) {
      topValue = mins;
      topCat = `${cat} (${(mins / 60).toFixed(1)} h)`;
    }
  }
  statTopCategory.textContent = topCat;

  buildCharts(categoryTotals);
  buildTimeline();
}

function buildCharts(categoryTotals) {
  const pieCanvas = document.getElementById("pieChart");
  const barCanvas = document.getElementById("barChart");

  const categories = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  if (pieChartInstance) pieChartInstance.destroy();
  if (barChartInstance) barChartInstance.destroy();

  if (categories.length === 0) {
    showNoDataView();
    return;
  }

  pieChartInstance = new Chart(pieCanvas.getContext("2d"), {
    type: "pie",
    data: {
      labels: categories,
      datasets: [{ data: values }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#e5e7eb" },
        },
      },
    },
  });

  const activityLabels = activities.map((a) => a.name);
  const activityDurations = activities.map((a) => a.duration);

  barChartInstance = new Chart(barCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: activityLabels,
      datasets: [{ label: "Minutes", data: activityDurations }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#e5e7eb" },
        },
      },
      scales: {
        x: { ticks: { color: "#9ca3af" } },
        y: { ticks: { color: "#9ca3af" } },
      },
    },
  });
}

function buildTimeline() {
  timelineList.innerHTML = "";
  activities.forEach((a) => {
    const li = document.createElement("li");
    li.className = "timeline-item";
    const left = document.createElement("span");
    left.textContent = a.name;
    const right = document.createElement("span");
    right.textContent = `${a.duration} min (${a.category})`;
    li.appendChild(left);
    li.appendChild(right);
    timelineList.appendChild(li);
  });
}
