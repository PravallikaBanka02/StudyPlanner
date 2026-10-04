# 📚 StudyPlanner Pro (Web Edition)

A full-stack, responsive Study Planner and Reading Hub web application built from your original C console program. It combines task management, subject-specific reading materials, and performance analytics.

---

## 🌟 What's New in this Version

1. **Authentication Landing Page First**:
   - The app now loads a dedicated, modern **Sign In / Create Account Screen** first.
   - Includes **"Continue with Google"**, traditional email/password, and an instant **"Test as Demo"** button.
   - The main Dashboard is securely displayed only after authentication, with a prominent **Sign Out** option that returns to the login screen.

2. **📚 Subject Reading Materials Hub**:
   - Attach essential documents, lecture notes, textbook chapters, cheatsheets, and web articles to specific subjects to improve reading and subject comprehension.
   - Track reading statuses: **To Read ⏳**, **Currently Reading 📖**, and **Finished Reading ✅**.
   - Includes an **In-App Distraction-Free Reader Modal** for studying cheatsheets, formulas, and notes directly inside the application.

3. **📊 Performance Analytics & Overview**:
   - **Study Streak Tracker** (e.g. 4 Days Streak 🔥).
   - **Focus & Efficiency Score** (0–100% composite score based on completed tasks and readings).
   - **Subject Effort & Time Distribution** (visual comparison of minutes invested across each subject).
   - **Reading Materials Progress Tracker**.
   - **Task Priority Breakdown** (High 🔥, Medium ⚡, Low 🌱).
   - **Smart Automated Study Recommendations** for upcoming sessions.

4. **⏱️ Integrated Pomodoro Study Timer**:
   - 25m Focus, 5m Short Break, and 15m Long Break modes.
   - Circular animated progress ring with audio bell alerts.
   - Focus directly on any planned task with one click.

---

## 🚀 Running the Project

### Option 1: Instant Browser Preview (Zero Installation)
1. Open [`frontend/index.html`](frontend/index.html) in your browser.
2. You will see the **Sign In / Sign Up** page.
3. Click **"Test as Demo"** or **"Continue with Google"** to immediately access the Dashboard in Local Mode!

### Option 2: Full-Stack Mode (Node.js & Express)
1. Start the server:
   ```bash
   cd backend
   npm install
   npm start
   ```
2. Open `http://localhost:5000` in your web browser.

### Option 3: Deploy to Render
- The project includes [`render.yaml`](render.yaml) and root [`package.json`](package.json).
- Push to GitHub and deploy via the Render Dashboard as described in [`DEPLOYMENT_RENDER.md`](DEPLOYMENT_RENDER.md).
