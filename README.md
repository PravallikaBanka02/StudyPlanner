# 📚 StudyPlanner Pro (Web Edition)

My project is live 🎉
Here is the live demo : https://studyplanner-2-ixzz.onrender.com/
A modern, full-stack Study Planner web application built directly from your original C console program. It retains the exact core architecture while introducing a responsive UI, Google Sign-In, authentication, and productivity tools like a Pomodoro Study Timer.

---

## 🌟 Mapping: C Program vs. Full-Stack Web App

| C Program Feature | Web Application Equivalent |
|---|---|
| `struct Task` (id, subject, topic, duration, priority, completed) | Structured Task Data Model in REST API & Frontend |
| `addTask()` | Interactive Modal with Subject suggestions & Priority selector (`POST /api/tasks`) |
| `viewTasks()` | Sleek responsive card grid with color-coded priority badges & status tags |
| `completeTask()` | One-click status toggle button with celebratory feedback & audio chime |
| `deleteTask()` | Instant deletion with confirmation dialog (`DELETE /api/tasks/:id`) |
| `saveTasks()` & `loadTasks()` | Persistent JSON database storage + automatic local offline fallback |
| Console Menu | Intuitive top navigation, search bar, and filter controls |

---

## ✨ Key New Features

1. **Authentication & Google Sign-In**:
   - One-click **Continue with Google** simulation and OAuth readiness.
   - Traditional Email & Password **Sign Up** and **Sign In**.
   - Built-in **Quick Test Demo** account (`alex@example.com` / `password123`) for zero-friction evaluation.
   - User profile dropdown with avatars and logout.

2. **Pomodoro Study Timer**:
   - Focus session modes: **25 min Study**, **5 min Short Break**, **15 min Long Break**.
   - Circular animated progress ring with live minute/second countdown.
   - Launch timer directly for any specific study task by clicking the ⏳ icon.
   - Audio bell chime upon session completion (powered by Web Audio API).

3. **Study Statistics & Dashboard**:
   - Real-time **Total Tasks**, **Completed**, and **Pending** count.
   - Animated **Completion Rate Progress Bar** (e.g. `75%`).
   - Formatted **Total Study Duration** in hours and minutes.

4. **Search, Filter & Sort**:
   - Instant search across subjects and topics.
   - Filter by **Priority** (🔥 High = 3, ⚡ Medium = 2, 🌱 Low = 1).
   - Filter by **Status** (Pending / Completed).
   - Dynamic subject filter dropdown.

5. **Aesthetics & Design**:
   - Modern glassmorphism dark mode with sleek light mode toggle (☀️/🌙).
   - High-contrast priority accent colors (Crimson for High, Amber for Medium, Emerald for Low).
   - Fully responsive on mobile, tablet, and desktop screens.

---

## 🚀 How to Run the Project

### Option 1: Instant Browser Preview (Zero Installation)
You can test the entire frontend immediately without installing anything:
1. Navigate to the `frontend/` directory.
2. Double-click **`index.html`** or right-click and open with your preferred browser (Chrome, Edge, Firefox).
3. The app automatically runs in **Offline / Local Mode** with pre-seeded study tasks and demo accounts.

---

### Option 2: Full-Stack Mode (Node.js & Express Backend)

#### Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or newer)

#### Steps
1. Open your terminal in the project directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your browser and go to:
   ```
   http://localhost:5000
   ```
   *The Express server automatically serves both the REST API and the frontend client!*

---

## 📁 Project Structure

```
StudyPlanner/
├── backend/
│   ├── data/
│   │   └── db.json          # Persistent database file (auto-generated)
│   ├── server.js            # Express REST API, JWT auth & task handlers
│   ├── package.json         # Node dependencies
│   └── .env.example         # Environment configuration
├── frontend/
│   ├── css/
│   │   └── style.css        # Modern styles, animations & theme variables
│   ├── js/
│   │   ├── api.js           # API client with automatic LocalStorage fallback
│   │   ├── auth.js          # Authentication & Google Sign-In handler
│   │   └── app.js           # Task management, Pomodoro timer & statistics
│   └── index.html           # Single Page Application view
├── main.c                   # Your original C program (preserved)
└── README.md                # Project documentation
```

---

## 🛠️ REST API Endpoints

- `POST /api/auth/register` - Create account (name, email, password)
- `POST /api/auth/login` - Sign in (email, password)
- `POST /api/auth/google` - Google Sign-In verification & user sync
- `GET  /api/auth/me` - Get logged-in user profile
- `GET  /api/tasks` - List tasks with query filters (`?search=`, `?priority=`, `?status=`, `?subject=`)
- `POST /api/tasks` - Add new study task
- `PUT  /api/tasks/:id` - Update existing study task
- `PATCH /api/tasks/:id/complete` - Toggle task completion status
- `DELETE /api/tasks/:id` - Delete study task
- `GET  /api/stats` - Fetch user study statistics & metrics
