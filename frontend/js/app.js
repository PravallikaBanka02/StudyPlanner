/**
 * Study Planner - Main Application Logic
 * Integrates task management, filtering, Pomodoro timer, audio chime, and stats.
 */

class StudyPlannerApp {
    constructor() {
        this.tasks = [];
        this.activeFilter = {
            search: '',
            priority: 'all',
            status: 'all',
            subject: 'all'
        };
        this.editingTaskId = null;

        // Pomodoro State
        this.pomodoroTimeLeft = 25 * 60;
        this.pomodoroTotalTime = 25 * 60;
        this.pomodoroTimerId = null;
        this.pomodoroIsRunning = false;
        this.currentPomodoroTask = null;
        this.pomodoroMode = 'study'; // 'study', 'shortBreak', 'longBreak'

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initTheme();
        this.displayRandomQuote();
        await this.loadTasksAndStats();
    }

    setupEventListeners() {
        // Search Input
        const searchInput = document.getElementById('taskSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.activeFilter.search = e.target.value;
                this.filterAndRenderTasks();
            });
        }

        // Filter Selectors
        const priorityFilter = document.getElementById('priorityFilter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.activeFilter.priority = e.target.value;
                this.filterAndRenderTasks();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.activeFilter.status = e.target.value;
                this.filterAndRenderTasks();
            });
        }

        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter) {
            subjectFilter.addEventListener('change', (e) => {
                this.activeFilter.subject = e.target.value;
                this.filterAndRenderTasks();
            });
        }

        // Add Task Modal Controls
        const btnOpenAddModal = document.getElementById('btnOpenAddModal');
        if (btnOpenAddModal) {
            btnOpenAddModal.addEventListener('click', () => this.openTaskModal());
        }

        const btnCloseTaskModal = document.getElementById('btnCloseTaskModal');
        const btnCancelTaskModal = document.getElementById('btnCancelTaskModal');
        if (btnCloseTaskModal) btnCloseTaskModal.addEventListener('click', () => this.closeTaskModal());
        if (btnCancelTaskModal) btnCancelTaskModal.addEventListener('click', () => this.closeTaskModal());

        // Task Form Submit
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleTaskFormSubmit(e));
        }

        // Priority Radio Selector in Modal
        const priorityOptions = document.querySelectorAll('.priority-option');
        priorityOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                priorityOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                const radio = opt.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            });
        });

        // Theme Toggle
        const themeToggleBtn = document.getElementById('btnThemeToggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Pomodoro Modal Controls
        const btnOpenPomodoro = document.getElementById('btnOpenPomodoro');
        const btnClosePomodoro = document.getElementById('btnClosePomodoro');
        if (btnOpenPomodoro) btnOpenPomodoro.addEventListener('click', () => this.openPomodoroModal());
        if (btnClosePomodoro) btnClosePomodoro.addEventListener('click', () => this.closePomodoroModal());

        // Pomodoro Timer Buttons
        const btnTimerStart = document.getElementById('btnTimerStart');
        const btnTimerReset = document.getElementById('btnTimerReset');
        if (btnTimerStart) btnTimerStart.addEventListener('click', () => this.togglePomodoro());
        if (btnTimerReset) btnTimerReset.addEventListener('click', () => this.resetPomodoro());

        // Pomodoro Mode Selectors
        const modeButtons = document.querySelectorAll('.pomodoro-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setPomodoroMode(btn.dataset.mode);
            });
        });
    }

    // ==========================================
    // TASK OPERATIONS (Matching C Program)
    // ==========================================

    async loadTasksAndStats() {
        try {
            this.tasks = await window.api.getTasks();
            this.updateSubjectDropdown();
            this.filterAndRenderTasks();
            this.updateStatistics();
        } catch (err) {
            console.error('Error loading tasks:', err);
            window.showToast('Failed to load study tasks', 'error');
        }
    }

    updateSubjectDropdown() {
        const subjectFilter = document.getElementById('subjectFilter');
        if (!subjectFilter) return;

        const currentVal = subjectFilter.value;
        const subjects = [...new Set(this.tasks.map(t => t.subject).filter(Boolean))];

        subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
        subjects.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            if (sub === currentVal) opt.selected = true;
            subjectFilter.appendChild(opt);
        });
    }

    filterAndRenderTasks() {
        let filtered = [...this.tasks];

        // Search Query
        if (this.activeFilter.search) {
            const query = this.activeFilter.search.toLowerCase();
            filtered = filtered.filter(t => 
                (t.subject && t.subject.toLowerCase().includes(query)) ||
                (t.topic && t.topic.toLowerCase().includes(query))
            );
        }

        // Priority Filter
        if (this.activeFilter.priority !== 'all') {
            filtered = filtered.filter(t => t.priority === parseInt(this.activeFilter.priority));
        }

        // Status Filter
        if (this.activeFilter.status !== 'all') {
            if (this.activeFilter.status === 'completed') {
                filtered = filtered.filter(t => t.completed === 1 || t.completed === true);
            } else if (this.activeFilter.status === 'pending') {
                filtered = filtered.filter(t => t.completed === 0 || t.completed === false);
            }
        }

        // Subject Filter
        if (this.activeFilter.subject !== 'all') {
            filtered = filtered.filter(t => t.subject.toLowerCase() === this.activeFilter.subject.toLowerCase());
        }

        this.renderTasks(filtered);
    }

    renderTasks(tasksToRender) {
        const grid = document.getElementById('tasksGrid');
        if (!grid) return;

        if (tasksToRender.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <h3 class="empty-state-title">No Study Tasks Found</h3>
                    <p class="empty-state-desc">
                        ${this.tasks.length === 0 
                            ? 'Your study schedule is empty! Click "+ Add New Task" to begin planning.' 
                            : 'No tasks match your selected filter criteria. Try adjusting the search or filters.'}
                    </p>
                    ${this.tasks.length === 0 ? `
                        <button class="btn btn-primary" onclick="app.openTaskModal()">
                            <span>+</span> Create First Task
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        grid.innerHTML = tasksToRender.map(task => {
            const isCompleted = task.completed === 1 || task.completed === true;
            
            // Priority label & style (1 = Low, 2 = Medium, 3 = High)
            let priorityText = 'Low';
            let priorityClass = 'low';
            if (task.priority === 2) {
                priorityText = 'Medium';
                priorityClass = 'medium';
            } else if (task.priority === 3) {
                priorityText = 'High';
                priorityClass = 'high';
            }

            return `
                <div class="task-card ${isCompleted ? 'completed' : ''}" data-priority="${task.priority}">
                    <div class="task-card-header">
                        <span class="subject-badge">${this.escapeHtml(task.subject)}</span>
                        <span class="priority-badge ${priorityClass}">
                            ${task.priority === 3 ? '🔥' : task.priority === 2 ? '⚡' : '🌱'} ${priorityText}
                        </span>
                    </div>

                    <h4 class="task-topic">${this.escapeHtml(task.topic)}</h4>

                    <div class="task-meta">
                        <span>⏱️ ${task.duration || 30} mins</span>
                        <span>🏷️ ID: #${task.id}</span>
                    </div>

                    <div class="task-card-footer">
                        <button class="complete-toggle-btn" onclick="app.toggleTaskComplete(${task.id})">
                            <span>${isCompleted ? '✓ Completed' : '○ Mark Done'}</span>
                        </button>

                        <div class="task-actions">
                            <button class="btn-card-action btn-pomodoro" title="Focus with Pomodoro" onclick="app.startPomodoroForTask(${task.id})">
                                ⏳
                            </button>
                            <button class="btn-card-action" title="Edit Task" onclick="app.openTaskModal(${task.id})">
                                ✏️
                            </button>
                            <button class="btn-card-action btn-delete" title="Delete Task" onclick="app.deleteTask(${task.id})">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed === 1 || t.completed === true).length;
        const pending = total - completed;
        const totalMinutes = this.tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Format hours & minutes
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const timeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        const statTotal = document.getElementById('statTotalTasks');
        const statCompleted = document.getElementById('statCompletedTasks');
        const statPending = document.getElementById('statPendingTasks');
        const statTime = document.getElementById('statStudyTime');
        const progressFill = document.getElementById('taskProgressFill');
        const progressPercent = document.getElementById('taskProgressPercent');

        if (statTotal) statTotal.textContent = total;
        if (statCompleted) statCompleted.textContent = completed;
        if (statPending) statPending.textContent = pending;
        if (statTime) statTime.textContent = timeFormatted;
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
    }

    // Toggle Task Completed (matching void completeTask())
    async toggleTaskComplete(id) {
        try {
            const updated = await window.api.toggleComplete(id);
            const index = this.tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                this.tasks[index] = updated;
            }

            if (updated.completed === 1) {
                window.showToast('🎉 Task marked as completed!', 'success');
                this.playChime(660, 0.15);
            } else {
                window.showToast('Task marked as pending.', 'info');
            }

            this.filterAndRenderTasks();
            this.updateStatistics();
        } catch (err) {
            window.showToast('Failed to update task: ' + err.message, 'error');
        }
    }

    // Delete Task (matching void deleteTask())
    async deleteTask(id) {
        const confirmed = confirm('Are you sure you want to delete this study task?');
        if (!confirmed) return;

        try {
            await window.api.deleteTask(id);
            this.tasks = this.tasks.filter(t => t.id !== id);
            window.showToast('Task deleted successfully!', 'info');
            this.updateSubjectDropdown();
            this.filterAndRenderTasks();
            this.updateStatistics();
        } catch (err) {
            window.showToast('Failed to delete task: ' + err.message, 'error');
        }
    }

    // Open Add or Edit Task Modal
    openTaskModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('taskModalTitle');
        const submitBtn = document.getElementById('btnSubmitTask');
        const subjectInput = document.getElementById('taskSubject');
        const topicInput = document.getElementById('taskTopic');
        const durationInput = document.getElementById('taskDuration');
        const priorityRadios = document.querySelectorAll('input[name="priority"]');

        this.editingTaskId = taskId;

        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            title.textContent = 'Edit Study Task';
            submitBtn.textContent = 'Save Changes';
            subjectInput.value = task.subject;
            topicInput.value = task.topic;
            durationInput.value = task.duration || 30;

            // Set priority
            priorityRadios.forEach(radio => {
                const isMatch = parseInt(radio.value) === task.priority;
                radio.checked = isMatch;
                const parent = radio.closest('.priority-option');
                if (parent) {
                    if (isMatch) parent.classList.add('selected');
                    else parent.classList.remove('selected');
                }
            });
        } else {
            title.textContent = 'Add Study Task';
            submitBtn.textContent = 'Add Task';
            document.getElementById('taskForm').reset();
            durationInput.value = 45;

            // Default to Medium priority (2)
            priorityRadios.forEach(radio => {
                const isDefault = parseInt(radio.value) === 2;
                radio.checked = isDefault;
                const parent = radio.closest('.priority-option');
                if (parent) {
                    if (isDefault) parent.classList.add('selected');
                    else parent.classList.remove('selected');
                }
            });
        }

        if (modal) modal.classList.add('active');
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) modal.classList.remove('active');
        this.editingTaskId = null;
    }

    async handleTaskFormSubmit(e) {
        e.preventDefault();
        const subject = document.getElementById('taskSubject').value.trim();
        const topic = document.getElementById('taskTopic').value.trim();
        const duration = parseInt(document.getElementById('taskDuration').value) || 30;
        
        let priority = 2;
        const checkedRadio = document.querySelector('input[name="priority"]:checked');
        if (checkedRadio) priority = parseInt(checkedRadio.value);

        if (!subject || !topic) {
            window.showToast('Please fill in both subject and topic.', 'error');
            return;
        }

        const taskData = { subject, topic, duration, priority };

        try {
            if (this.editingTaskId) {
                const updated = await window.api.updateTask(this.editingTaskId, taskData);
                const index = this.tasks.findIndex(t => t.id === this.editingTaskId);
                if (index !== -1) this.tasks[index] = updated;
                window.showToast('Task updated successfully!', 'success');
            } else {
                const created = await window.api.addTask(taskData);
                this.tasks.unshift(created);
                window.showToast('Task added successfully!', 'success');
            }

            this.closeTaskModal();
            this.updateSubjectDropdown();
            this.filterAndRenderTasks();
            this.updateStatistics();
        } catch (err) {
            window.showToast(err.message, 'error');
        }
    }

    // ==========================================
    // POMODORO TIMER
    // ==========================================

    openPomodoroModal() {
        const modal = document.getElementById('pomodoroModal');
        if (modal) modal.classList.add('active');
        this.updatePomodoroDisplay();
    }

    closePomodoroModal() {
        const modal = document.getElementById('pomodoroModal');
        if (modal) modal.classList.remove('active');
    }

    startPomodoroForTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentPomodoroTask = task;
        const taskInfo = document.getElementById('pomodoroCurrentTask');
        if (taskInfo) {
            taskInfo.textContent = `🎯 Focusing on: ${task.subject} - ${task.topic}`;
            taskInfo.style.display = 'block';
        }

        // Set duration to task's duration or default pomodoro
        const minutes = task.duration && task.duration > 0 && task.duration <= 120 ? task.duration : 25;
        this.setPomodoroDuration(minutes * 60);
        this.openPomodoroModal();
    }

    setPomodoroMode(mode) {
        this.pomodoroMode = mode;
        this.pausePomodoro();

        if (mode === 'study') {
            const minutes = this.currentPomodoroTask ? this.currentPomodoroTask.duration : 25;
            this.setPomodoroDuration((minutes || 25) * 60);
        } else if (mode === 'shortBreak') {
            this.setPomodoroDuration(5 * 60);
        } else if (mode === 'longBreak') {
            this.setPomodoroDuration(15 * 60);
        }
    }

    setPomodoroDuration(seconds) {
        this.pomodoroTotalTime = seconds;
        this.pomodoroTimeLeft = seconds;
        this.updatePomodoroDisplay();
    }

    togglePomodoro() {
        if (this.pomodoroIsRunning) {
            this.pausePomodoro();
        } else {
            this.startPomodoro();
        }
    }

    startPomodoro() {
        this.pomodoroIsRunning = true;
        const btn = document.getElementById('btnTimerStart');
        if (btn) btn.innerHTML = '⏸️ Pause';

        this.pomodoroTimerId = setInterval(() => {
            if (this.pomodoroTimeLeft > 0) {
                this.pomodoroTimeLeft--;
                this.updatePomodoroDisplay();
            } else {
                this.onPomodoroComplete();
            }
        }, 1000);
    }

    pausePomodoro() {
        this.pomodoroIsRunning = false;
        clearInterval(this.pomodoroTimerId);
        const btn = document.getElementById('btnTimerStart');
        if (btn) btn.innerHTML = '▶️ Start Focus';
    }

    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroTimeLeft = this.pomodoroTotalTime;
        this.updatePomodoroDisplay();
    }

    updatePomodoroDisplay() {
        const mins = Math.floor(this.pomodoroTimeLeft / 60);
        const secs = this.pomodoroTimeLeft % 60;
        const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const display = document.getElementById('timerDigits');
        if (display) display.textContent = formatted;

        // Update circular SVG progress
        const circle = document.getElementById('timerProgressCircle');
        if (circle) {
            const totalCircumference = 2 * Math.PI * 90; // r=90, circumference ~= 565.48
            const progress = this.pomodoroTimeLeft / this.pomodoroTotalTime;
            const strokeDashoffset = totalCircumference * (1 - progress);
            circle.style.strokeDashoffset = strokeDashoffset;
        }

        // Update browser tab title
        document.title = this.pomodoroIsRunning ? `(${formatted}) Study Planner` : 'Study Planner';
    }

    onPomodoroComplete() {
        this.pausePomodoro();
        this.playChime(880, 0.4);

        if (this.pomodoroMode === 'study') {
            window.showToast('🎯 Focus session complete! Take a well-deserved break.', 'success');
            if (this.currentPomodoroTask) {
                const completeNow = confirm(`Well done! Would you like to mark "${this.currentPomodoroTask.topic}" as completed?`);
                if (completeNow) {
                    this.toggleTaskComplete(this.currentPomodoroTask.id);
                }
            }
            this.setPomodoroMode('shortBreak');
        } else {
            window.showToast('☕ Break finished! Ready to dive back in?', 'info');
            this.setPomodoroMode('study');
        }
    }

    // Audio chime using Web Audio API (zero external sound files required)
    playChime(frequency = 587.33, duration = 0.3) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + duration);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch {
            // Audio context may require prior user interaction
        }
    }

    // ==========================================
    // THEME & UTILITIES
    // ==========================================

    initTheme() {
        const savedTheme = localStorage.getItem('study_planner_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('study_planner_theme', next);
        this.updateThemeIcon(next);
    }

    updateThemeIcon(theme) {
        const btn = document.getElementById('btnThemeToggle');
        if (btn) {
            btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
        }
    }

    displayRandomQuote() {
        const quotes = [
            "“Live as if you were to die tomorrow. Learn as if you were to live forever.” – Mahatma Gandhi",
            "“Success is the sum of small efforts, repeated day in and day out.” – Robert Collier",
            "“The expert in anything was once a beginner.” – Helen Hayes",
            "“Focus on being productive instead of busy.” – Tim Ferriss",
            "“Small daily improvements over time lead to stunning results.” – Robin Sharma"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        const quoteEl = document.getElementById('motivationalQuote');
        if (quoteEl) quoteEl.textContent = randomQuote;
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Instantiate global app
window.app = new StudyPlannerApp();
