# 🎓 StudyPlanner Pro Web Application

[![Live Demo](https://img.shields.io/badge/Live%20Demo-studyplanner--g4ab.onrender.com-success?style=for-the-badge&logo=render)](https://studyplanner-g4ab.onrender.com)
[![Status](https://img.shields.io/badge/Status-Live%20%26%20Operational-brightgreen?style=for-the-badge)]()
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?style=for-the-badge&logo=node.js)]()
[![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)]()
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)]()

> **Live Application URL:** **[https://studyplanner-g4ab.onrender.com](https://studyplanner-g4ab.onrender.com)**

A full-stack study productivity suite evolved from a foundational C command-line study planner into a modern web application featuring Google/Email authentication, Pomodoro focus timers with procedural sound synthesis, time studied analytics, and a subject document vault.

---

## 🌐 Live Deployment

The application is deployed and hosted on Render:

🔗 **[https://studyplanner-g4ab.onrender.com](https://studyplanner-g4ab.onrender.com)**

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js Express REST API, Multer file upload engine, persistent JSON store.
- **Audio Engine:** HTML5 Web Audio API synthesizer for offline ambient soundscapes.

---

## ✨ Features

### 1. 🔐 Authentication (Google & Email)
- **Google Sign-In**: Quick Google account sign-in simulation with custom or preset accounts.
- **Email & Password**: User signup and login with avatar creation.
- **Clean State for New Users**: Any newly registered user or custom Google account starts completely fresh with **0 dummy data** (0 tasks, 0 sessions, 0 documents, 0 streak).
- **Test Accounts (With Sample Data)**: Pre-configured 1-click test accounts (`Demo Tester`, `Sarah Chen`) allow testing with pre-populated tasks, historical study analytics, and sample cheatsheets.

### 2. 📊 Interactive Dashboard
- **Key Metrics**:
  - Total Hours & Cumulative Minutes Studied.
  - Today's Focus Minutes vs 60m daily target.
  - Completed vs Pending Tasks with an animated progress meter.
  - Study Streak counter with active flame badge (🔥).
- **7-Day Study Activity Chart**: Visual bar graph measuring daily focus consistency.
- **Subject Time Allocation**: Real-time breakdown of time invested per subject.
- **Quick Focus Launcher**: Automatically isolates the highest-priority pending task to jump straight into a focus sprint.
- **Checklist Preview**: Toggle tasks completed directly from the dashboard.

### 3. 📋 Study Tasks Manager (C Program Parity)
Directly evolves the original C program struct (`id`, `subject`, `topic`, `duriation`, `priority`, `completed`):
- **Priority Badging**: 1 = 🟢 Low, 2 = 🟡 Medium, 3 = 🔴 High.
- **Search & Filters**: Search topic or subject names, filter by Subject, Priority, or Completion Status.
- **Task Actions**: Add, edit, toggle completed, delete, or launch into focus timer.

### 4. ⏱️ Focus Mode & Procedural Ambiance
- **Pomodoro & Deep Work Timers**: Presets for 15m, 25m Pomodoro, 45m Lecture, 60m Deep Work, or custom task duration.
- **Circular Glow Progress Ring**: Visual countdown with seconds-precision.
- **Procedural Audio Synthesizer (Web Audio API)**:
  - 🌧️ *Gentle Rainfall* (filtered pink noise)
  - 🧠 *10Hz Alpha Waves* (binaural beat synthesizer tuned for deep focus)
  - 📻 *White Noise Shroud*
  - *Generated directly in-browser using Web Audio oscillators — zero external MP3 dependencies.*
- **Zen / Fullscreen Mode**: Distraction-free study interface.
- **Celebration & Auto-Logging**: Chime sound and confetti burst upon session completion with automatic study time logging.

### 5. 📈 Time Studied & Streak Analytics
- Complete chronological history table of all study sessions (Date, Subject, Topic, Duration, Focus Score, Notes).
- Subject distribution percentages and weekly trends.
- Option to manually log offline textbook or classroom study time.

### 6. 📁 Subject Documents Vault
- **Subject-Specific File Repository**:
  - Filter and categorize documents by subject (*Operating Systems*, *Data Structures*, *Mathematics*, etc.).
  - Upload lecture notes, PDF guides, cheatsheets, source code (`.c`, `.cpp`, `.py`), or slides (up to 50MB).
- **In-App Preview & Downloads**: View text notes and source code directly in a preview modal; download attachments with one click.

---

## 🎨 Design & Color Palette

- **Background**: Deep obsidian slate (`#020617`, `#0f172a`) with subtle glowing radial gradients.
- **Primary Accent**: Electric Indigo (`#6366f1`) and Royal Violet (`#8b5cf6`).
- **Priority Indicators**:
  - 🟢 Low Priority: Emerald Green (`#10b981`)
  - 🟡 Medium Priority: Warm Amber (`#f59e0b`)
  - 🔴 High Priority: Crimson Rose (`#f43f5e`)
- **Typography**: *Plus Jakarta Sans* for clean UI and *JetBrains Mono* for code/numbers.

---

## 🛠️ Project Structure

```
StudyPlanner/
├── main.c                 # Original C implementation
├── package.json           # Root project script runner (Render compatible)
├── render.yaml            # Render Blueprint deployment configuration
├── README.md              # Documentation
├── server/
│   ├── package.json       # Express, Multer, Cors
│   ├── uploads/           # Uploaded subject files directory
│   ├── data/
│   │   └── study_planner_db.json # Persistent JSON database
│   └── src/
│       ├── index.js       # Express REST API & static client server
│       └── db.js          # File storage & demo account seed logic
└── client/
    ├── package.json       # React, Tailwind, Lucide, Canvas Confetti, Vite
    ├── vite.config.js     # Vite configuration with API proxy
    ├── tailwind.config.js # Theme colors, gradients, and typography
    ├── index.html         # HTML entry point
    └── src/
        ├── main.jsx       # App bootstrap
        ├── App.jsx        # Root application controller
        ├── index.css      # Glassmorphism & custom utility styling
        ├── services/
        │   ├── api.js           # REST API client
        │   └── audioService.js  # Procedural Web Audio sound generator
        ├── context/
        │   └── AuthContext.jsx  # Google & Email auth state
        ├── components/
        │   ├── Navbar.jsx       # Navigation, streak badge & audio controller
        │   └── AuthModal.jsx    # Google & Email sign-in modal
        └── pages/
            ├── Dashboard.jsx      # Overview cards, 7-day chart & priority launcher
            ├── TasksView.jsx      # Study tasks manager (C struct parity)
            ├── FocusMode.jsx      # Pomodoro timer, ambient sounds & fullscreen
            ├── TimeStudied.jsx    # Study hours, subject allocation & history
            └── DocumentsVault.jsx # Subject document upload, preview & download
```

---

## 💻 Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/PravallikaBanka02/StudyPlanner.git
   cd StudyPlanner
   ```

2. Build and start the full-stack app:
   ```bash
   # Single command builds client and runs backend on port 5000:
   npm run build
   npm start
   ```

3. Open **`http://localhost:5000`** in your browser.

For hot-reloading development mode:
```bash
# Terminal 1: Backend API
cd server && npm start

# Terminal 2: Frontend with Vite
cd client && npm run dev
```
Navigate to **`http://localhost:3000`**.
