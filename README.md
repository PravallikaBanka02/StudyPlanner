# 🎓 StudyPlanner Pro Web Application

An attractive, production-ready full-stack productivity web application evolved from your original C `StudyPlanner` engine.

---

## ✨ Features

### 1. 🔐 Authentication (Google & Email)
- **Google Sign-In**: One-click Google authentication with simulated profiles (e.g., *Mohit Banka*, *Sarah Chen*) or custom credentials.
- **Email & Password**: Seamless sign-in and registration with avatar generation and profile switching.
- **Auto-Redirection**: Automatically guides the authenticated user directly into the **Dashboard**.

### 2. 📊 Interactive Study Dashboard
- **Key Metrics Overview**:
  - Total Hours & Minutes Studied
  - Today's Focus Minutes vs Daily Targets
  - Completed vs Pending Tasks with dynamic progress bar
  - Study Streak counter with active flame badge (🔥)
- **7-Day Activity Chart**: Visual bar graph comparing study duration across the week.
- **Subject Time Distribution**: Percentage meters showing time allocation per subject.
- **Next Priority Focus**: One-click launcher that pushes the top priority task directly into the Focus Timer.
- **Active Task Checklist**: Mark tasks as completed or pending directly with real-time sync.

### 3. 📋 Study Tasks Manager (Evolved from C `main.c`)
- **Direct Parity with C Code**:
  - `id`: Unique incremental identifier
  - `subject`: Subject name (e.g., *Operating Systems*, *Data Structures*)
  - `topic`: Specific study topic
  - `duriation`: Target duration in minutes
  - `priority`: 1 = Low (Green), 2 = Medium (Amber), 3 = High (Rose)
  - `completed`: 0 = Pending, 1 = Completed
- **Search & Multi-Filters**: Filter by Subject, Priority level, or Completion Status. Search by topic or subject keywords.
- **Interactive Actions**: Complete, Edit, Delete, or Launch into Focus Mode.

### 4. ⏱️ Focus Mode & Ambient Ambiance
- **Pomodoro & Deep Work Timers**:
  - Presets (15m, 25m Pomodoro, 45m Lecture, 60m Deep Work) or custom task duration.
  - Glowing circular countdown progress ring with seconds-level precision.
- **Built-in Procedural Audio Synthesizer (Web Audio API)**:
  - 🌧️ **Gentle Rainfall**: Pink noise filtered for natural rainfall.
  - 🧠 **10Hz Alpha Waves**: Binaural beat synthesizer tuned for deep focus.
  - 📻 **White Noise Shroud**: Distraction-blocking frequency mask.
  - *No external MP3 dependencies; generated natively by browser audio synthesis.*
- **Zen / Fullscreen Mode**: Remove all interface clutter for pure distraction-free study.
- **Celebration & Automatic Logging**:
  - Synthesized chime chord on completion.
  - Confetti burst (`canvas-confetti`).
  - Auto-prompts to mark the linked task completed and logs study time to your analytics.

### 5. 📈 Time Studied & Streak Analytics
- **Comprehensive Visual Breakdown**:
  - 7-Day study graph with minute counters.
  - Total study hours and percentage share per subject.
  - Consistency scoring and streak tracking.
- **Full History Log**: Chronological table of study sessions (Date, Subject, Topic, Duration, Focus Score, Reflections).
- **Log Offline Study**: Record textbook reading or offline classroom hours.

### 6. 📁 Subject Documents Vault
- **Subject-Specific File Organization**:
  - Filter documents by subject (*Operating Systems*, *Data Structures*, *Mathematics*, etc.).
  - Upload lecture notes, PDF guides, cheatsheets, source code (`.c`, `.cpp`, `.py`), or slides up to 50MB.
- **Quick Preview**: Built-in preview modal for code snippets, text files, and notes.
- **Direct Download & Delete**: Download uploaded files or remove outdated documents.

---

## 🎨 Color Palette & Design
- **Theme**: Obsidian slate background (`#020617`, `#0f172a`) paired with Electric Indigo (`#6366f1`) and Royal Violet (`#8b5cf6`).
- **Priority Indicators**:
  - 🟢 Low Priority: Emerald Green (`#10b981`)
  - 🟡 Medium Priority: Warm Amber (`#f59e0b`)
  - 🔴 High Priority: Crimson Rose (`#f43f5e`)
- **Typography**: Clean geometric typography using *Plus Jakarta Sans* and *JetBrains Mono*.

---

## 🚀 How to Run

### Quick Start (Single Command)
From the project root directory:

```bash
# Start backend (serves both API & Frontend on port 5000)
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

---

### Development Mode (Hot-Reloading)

#### 1. Backend Server
```bash
cd server
npm start
# Runs Express on http://localhost:5000
```

#### 2. Frontend Client (Vite Dev Server)
```bash
cd client
npm run dev
# Runs Vite on http://localhost:3000 (proxies API requests to :5000)
```

---

## 📂 Project Structure

```
StudyPlanner/
├── main.c                 # Original C implementation
├── package.json           # Root project script runner
├── README.md              # Project documentation
├── server/
│   ├── package.json       # Express, Multer, Cors
│   ├── uploads/           # Uploaded subject documents directory
│   ├── data/
│   │   └── study_planner_db.json # Persistent JSON database
│   └── src/
│       ├── index.js       # Express REST API & static file server
│       └── db.js          # File storage & default seed data
└── client/
    ├── package.json       # React, Tailwind, Lucide, Canvas Confetti
    ├── vite.config.js     # Vite configuration with API proxy
    ├── tailwind.config.js # Custom colors, gradients, and typography
    ├── index.html         # Web entry point
    └── src/
        ├── main.jsx       # App bootstrap
        ├── App.jsx        # Root application controller
        ├── index.css      # Custom styling & glassmorphism
        ├── services/
        │   ├── api.js           # REST API client
        │   └── audioService.js  # Web Audio API procedural sound generator
        ├── context/
        │   └── AuthContext.jsx  # Google & Email auth state
        ├── components/
        │   ├── Navbar.jsx       # Top navigation, streak badge & audio controller
        │   └── AuthModal.jsx    # Google & Email sign-in modal
        └── pages/
            ├── Dashboard.jsx      # Overview cards, 7-day chart & priority launcher
            ├── TasksView.jsx      # Study tasks manager (C struct parity)
            ├── FocusMode.jsx      # Pomodoro timer, ambient sounds & fullscreen
            ├── TimeStudied.jsx    # Study hours, subject allocation & history
            └── DocumentsVault.jsx # Subject document upload, preview & download
```
