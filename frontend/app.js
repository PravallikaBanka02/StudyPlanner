/**
 * Study Planner - Main Application Logic
 * Integrates:
 * 1. Screen Tabs (Tasks & Planner, Reading Hub & Documents, Analytics & Overview)
 * 2. Task Management & Filters (matching original C program)
 * 3. Subject Reading Materials Hub & In-App Reader
 * 4. Analytics & Overview Dashboard
 * 5. Pomodoro Study Timer & Audio Chimes
 */

class StudyPlannerApp {
    constructor() {
        this.currentView = 'tasks'; // 'tasks', 'documents', 'analytics'
        this.tasks = [];
        this.documents = [];
        this.analyticsData = null;

        // Task Filters
        this.taskFilter = {
            search: '',
            priority: 'all',
            status: 'all',
            subject: 'all'
        };
        this.editingTaskId = null;

        // Document Filters
        this.docFilter = {
            search: '',
            subject: 'all',
            status: 'all',
            type: 'all'
        };
        this.editingDocId = null;

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
        // loadAllData will be called by authManager once user is authenticated
    }

    async loadAllData() {
        await Promise.all([
            this.loadTasksAndStats(),
            this.loadDocuments(),
            this.loadAnalytics()
        ]);
        this.populateSubjectSelects();
    }

    setupEventListeners() {
        // Navigation Tab Switching
        const navTabs = document.querySelectorAll('.nav-tab-btn');
        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                navTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.switchView(tab.dataset.view);
            });
        });

        // ================= TASKS LISTENERS =================
        const searchInput = document.getElementById('taskSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.taskFilter.search = e.target.value;
                this.filterAndRenderTasks();
            });
        }

        const priorityFilter = document.getElementById('priorityFilter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.taskFilter.priority = e.target.value;
                this.filterAndRenderTasks();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.taskFilter.status = e.target.value;
                this.filterAndRenderTasks();
            });
        }

        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter) {
            subjectFilter.addEventListener('change', (e) => {
                this.taskFilter.subject = e.target.value;
                this.filterAndRenderTasks();
            });
        }

        // Add Task Modal Controls
        const btnOpenAddModal = document.getElementById('btnOpenAddModal');
        if (btnOpenAddModal) btnOpenAddModal.addEventListener('click', () => this.openTaskModal());

        const btnCloseTaskModal = document.getElementById('btnCloseTaskModal');
        const btnCancelTaskModal = document.getElementById('btnCancelTaskModal');
        if (btnCloseTaskModal) btnCloseTaskModal.addEventListener('click', () => this.closeTaskModal());
        if (btnCancelTaskModal) btnCancelTaskModal.addEventListener('click', () => this.closeTaskModal());

        const taskForm = document.getElementById('taskForm');
        if (taskForm) taskForm.addEventListener('submit', (e) => this.handleTaskFormSubmit(e));

        const priorityOptions = document.querySelectorAll('.priority-option');
        priorityOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                priorityOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                const radio = opt.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            });
        });

        // ================= DOCUMENTS LISTENERS =================
        const docSearchInput = document.getElementById('docSearch');
        if (docSearchInput) {
            docSearchInput.addEventListener('input', (e) => {
                this.docFilter.search = e.target.value;
                this.filterAndRenderDocuments();
            });
        }

        const docSubjectFilter = document.getElementById('docSubjectFilter');
        if (docSubjectFilter) {
            docSubjectFilter.addEventListener('change', (e) => {
                this.docFilter.subject = e.target.value;
                this.filterAndRenderDocuments();
            });
        }

        const docStatusFilter = document.getElementById('docStatusFilter');
        if (docStatusFilter) {
            docStatusFilter.addEventListener('change', (e) => {
                this.docFilter.status = e.target.value;
                this.filterAndRenderDocuments();
            });
        }

        const docTypeFilter = document.getElementById('docTypeFilter');
        if (docTypeFilter) {
            docTypeFilter.addEventListener('change', (e) => {
                this.docFilter.type = e.target.value;
                this.filterAndRenderDocuments();
            });
        }

        // Add Document Modal Controls
        const btnOpenAddDocModal = document.getElementById('btnOpenAddDocModal');
        if (btnOpenAddDocModal) btnOpenAddDocModal.addEventListener('click', () => this.openDocModal());

        const btnCloseDocModal = document.getElementById('btnCloseDocModal');
        const btnCancelDocModal = document.getElementById('btnCancelDocModal');
        if (btnCloseDocModal) btnCloseDocModal.addEventListener('click', () => this.closeDocModal());
        if (btnCancelDocModal) btnCancelDocModal.addEventListener('click', () => this.closeDocModal());

        const docForm = document.getElementById('docForm');
        if (docForm) docForm.addEventListener('submit', (e) => this.handleDocFormSubmit(e));

        // Reader Modal Controls
        const btnCloseReaderModal = document.getElementById('btnCloseReaderModal');
        if (btnCloseReaderModal) btnCloseReaderModal.addEventListener('click', () => this.closeReaderModal());

        // ================= POMODORO & THEME =================
        const themeToggleBtn = document.getElementById('btnThemeToggle');
        if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        const btnOpenPomodoro = document.getElementById('btnOpenPomodoro');
        const btnClosePomodoro = document.getElementById('btnClosePomodoro');
        if (btnOpenPomodoro) btnOpenPomodoro.addEventListener('click', () => this.openPomodoroModal());
        if (btnClosePomodoro) btnClosePomodoro.addEventListener('click', () => this.closePomodoroModal());

        const btnTimerStart = document.getElementById('btnTimerStart');
        const btnTimerReset = document.getElementById('btnTimerReset');
        if (btnTimerStart) btnTimerStart.addEventListener('click', () => this.togglePomodoro());
        if (btnTimerReset) btnTimerReset.addEventListener('click', () => this.resetPomodoro());

        const modeButtons = document.querySelectorAll('.pomodoro-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setPomodoroMode(btn.dataset.mode);
            });
        });
    }

    // Switch main tabs
    switchView(viewName) {
        this.currentView = viewName;

        const viewTasks = document.getElementById('viewTasks');
        const viewDocuments = document.getElementById('viewDocuments');
        const viewAnalytics = document.getElementById('viewAnalytics');

        if (viewTasks) viewTasks.style.display = viewName === 'tasks' ? 'block' : 'none';
        if (viewDocuments) viewDocuments.style.display = viewName === 'documents' ? 'block' : 'none';
        if (viewAnalytics) viewAnalytics.style.display = viewName === 'analytics' ? 'block' : 'none';

        if (viewName === 'analytics') {
            this.loadAnalytics();
        } else if (viewName === 'documents') {
            this.loadDocuments();
        } else if (viewName === 'tasks') {
            this.loadTasksAndStats();
        }
    }

    // ==========================================
    // TASK OPERATIONS (From C Code)
    // ==========================================

    async loadTasksAndStats() {
        try {
            this.tasks = await window.api.getTasks();
            this.populateSubjectSelects();
            this.filterAndRenderTasks();
            this.updateStatistics();
        } catch (err) {
            console.error('Error loading tasks:', err);
        }
    }

    populateSubjectSelects() {
        const subjects = [
            ...new Set([
                ...this.tasks.map(t => t.subject),
                ...this.documents.map(d => d.subject)
            ].filter(Boolean))
        ];

        // Populate Task Subject Filter
        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter) {
            const current = subjectFilter.value;
            subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
            subjects.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                if (sub === current) opt.selected = true;
                subjectFilter.appendChild(opt);
            });
        }

        // Populate Document Subject Filter
        const docSubjectFilter = document.getElementById('docSubjectFilter');
        if (docSubjectFilter) {
            const current = docSubjectFilter.value;
            docSubjectFilter.innerHTML = '<option value="all">All Subjects</option>';
            subjects.forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                if (sub === current) opt.selected = true;
                docSubjectFilter.appendChild(opt);
            });
        }
    }

    filterAndRenderTasks() {
        let filtered = [...this.tasks];

        if (this.taskFilter.search) {
            const query = this.taskFilter.search.toLowerCase();
            filtered = filtered.filter(t => 
                (t.subject && t.subject.toLowerCase().includes(query)) ||
                (t.topic && t.topic.toLowerCase().includes(query))
            );
        }

        if (this.taskFilter.priority !== 'all') {
            filtered = filtered.filter(t => t.priority === parseInt(this.taskFilter.priority));
        }

        if (this.taskFilter.status !== 'all') {
            if (this.taskFilter.status === 'completed') {
                filtered = filtered.filter(t => t.completed === 1 || t.completed === true);
            } else if (this.taskFilter.status === 'pending') {
                filtered = filtered.filter(t => t.completed === 0 || t.completed === false);
            }
        }

        if (this.taskFilter.subject !== 'all') {
            filtered = filtered.filter(t => t.subject.toLowerCase() === this.taskFilter.subject.toLowerCase());
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
                            ? 'Your study schedule is empty! Click "+ Add Task" to begin planning.' 
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

    async deleteTask(id) {
        const confirmed = confirm('Are you sure you want to delete this study task?');
        if (!confirmed) return;

        try {
            await window.api.deleteTask(id);
            this.tasks = this.tasks.filter(t => t.id !== id);
            window.showToast('Task deleted successfully!', 'info');
            this.populateSubjectSelects();
            this.filterAndRenderTasks();
            this.updateStatistics();
        } catch (err) {
            window.showToast('Failed to delete task: ' + err.message, 'error');
        }
    }

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
            this.populateSubjectSelects();
            this.filterAndRenderTasks();
            this.updateStatistics();
        } catch (err) {
            window.showToast(err.message, 'error');
        }
    }

    // ==========================================
    // STUDY DOCUMENTS & READING MATERIALS HUB
    // ==========================================

    async loadDocuments() {
        try {
            this.documents = await window.api.getDocuments();
            this.populateSubjectSelects();
            this.filterAndRenderDocuments();
            this.updateDocumentStats();
        } catch (err) {
            console.error('Error loading documents:', err);
        }
    }

    filterAndRenderDocuments() {
        let filtered = [...this.documents];

        if (this.docFilter.search) {
            const q = this.docFilter.search.toLowerCase();
            filtered = filtered.filter(d => 
                (d.title && d.title.toLowerCase().includes(q)) ||
                (d.subject && d.subject.toLowerCase().includes(q)) ||
                (d.content && d.content.toLowerCase().includes(q))
            );
        }

        if (this.docFilter.subject !== 'all') {
            filtered = filtered.filter(d => d.subject.toLowerCase() === this.docFilter.subject.toLowerCase());
        }

        if (this.docFilter.status !== 'all') {
            filtered = filtered.filter(d => d.status === this.docFilter.status);
        }

        if (this.docFilter.type !== 'all') {
            filtered = filtered.filter(d => d.type === this.docFilter.type);
        }

        this.renderDocuments(filtered);
    }

    renderDocuments(docsToRender) {
        const grid = document.getElementById('documentsGrid');
        if (!grid) return;

        if (docsToRender.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">📖</div>
                    <h3 class="empty-state-title">No Study Documents Found</h3>
                    <p class="empty-state-desc">
                        ${this.documents.length === 0 
                            ? 'Add reading materials, textbook links, and cheatsheets to boost your subject knowledge.' 
                            : 'No reading resources match your filters. Try clearing search or filters.'}
                    </p>
                    ${this.documents.length === 0 ? `
                        <button class="btn btn-primary" onclick="app.openDocModal()">
                            <span>+</span> Add First Document
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        grid.innerHTML = docsToRender.map(doc => {
            const isCompleted = doc.status === 'completed';
            const isReading = doc.status === 'reading';

            // Document type icon & label
            let typeBadge = '📝 Notes / Cheatsheet';
            if (doc.type === 'pdf') typeBadge = '📄 PDF Reference';
            else if (doc.type === 'article') typeBadge = '🌐 Web Article';
            else if (doc.type === 'book') typeBadge = '📗 Textbook Chapter';

            // Status Badge
            let statusPill = `<span class="doc-status-badge to-read">⏳ To Read</span>`;
            if (isReading) statusPill = `<span class="doc-status-badge reading">📖 Reading</span>`;
            if (isCompleted) statusPill = `<span class="doc-status-badge completed">✅ Completed</span>`;

            return `
                <div class="doc-card ${isCompleted ? 'completed' : ''}">
                    <div class="doc-card-header">
                        <span class="subject-badge">${this.escapeHtml(doc.subject)}</span>
                        ${statusPill}
                    </div>

                    <h4 class="doc-title">${this.escapeHtml(doc.title)}</h4>

                    <div class="doc-meta">
                        <span>${typeBadge}</span>
                        <span>⏱️ ~${doc.readTime || 15} mins</span>
                    </div>

                    <p class="doc-preview">
                        ${doc.content ? this.escapeHtml(doc.content.substring(0, 110)) + '...' : 'External reading reference link.'}
                    </p>

                    <div class="doc-card-footer">
                        <button class="btn btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;" onclick="app.openReaderModal(${doc.id})">
                            ${doc.url ? '🔗 Open Resource' : '📖 Read Notes'}
                        </button>

                        <div style="display: flex; gap: 0.35rem; align-items: center;">
                            <!-- Status Selector -->
                            <select class="custom-select" style="padding: 0.3rem 1.6rem 0.3rem 0.6rem; font-size: 0.75rem;" onchange="app.updateDocStatus(${doc.id}, this.value)">
                                <option value="to_read" ${doc.status === 'to_read' ? 'selected' : ''}>To Read</option>
                                <option value="reading" ${doc.status === 'reading' ? 'selected' : ''}>Reading</option>
                                <option value="completed" ${doc.status === 'completed' ? 'selected' : ''}>Completed</option>
                            </select>

                            <button class="btn-card-action" title="Edit Document" onclick="app.openDocModal(${doc.id})">
                                ✏️
                            </button>
                            <button class="btn-card-action btn-delete" title="Delete Document" onclick="app.deleteDocument(${doc.id})">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateDocumentStats() {
        const total = this.documents.length;
        const completed = this.documents.filter(d => d.status === 'completed').length;
        const reading = this.documents.filter(d => d.status === 'reading').length;
        const toRead = this.documents.filter(d => d.status === 'to_read').length;
        const totalMinutes = this.documents.reduce((sum, d) => sum + (d.readTime || 0), 0);

        const elTotal = document.getElementById('statTotalDocs');
        const elRead = document.getElementById('statReadDocs');
        const elReading = document.getElementById('statReadingDocs');
        const elReadTime = document.getElementById('statReadingTime');

        if (elTotal) elTotal.textContent = total;
        if (elRead) elRead.textContent = completed;
        if (elReading) elReading.textContent = reading;
        if (elReadTime) elReadTime.textContent = `${totalMinutes}m`;
    }

    async updateDocStatus(id, newStatus) {
        try {
            const updated = await window.api.updateDocumentStatus(id, newStatus);
            const index = this.documents.findIndex(d => d.id === id);
            if (index !== -1) this.documents[index] = updated;

            if (newStatus === 'completed') {
                window.showToast('🎉 Document marked as Read!', 'success');
                this.playChime(784, 0.2);
            } else {
                window.showToast(`Status updated to "${newStatus.replace('_', ' ')}"`, 'info');
            }

            this.filterAndRenderDocuments();
            this.updateDocumentStats();
        } catch (err) {
            window.showToast('Failed to update status: ' + err.message, 'error');
        }
    }

    async deleteDocument(id) {
        const confirmed = confirm('Delete this study document?');
        if (!confirmed) return;

        try {
            await window.api.deleteDocument(id);
            this.documents = this.documents.filter(d => d.id !== id);
            window.showToast('Document deleted.', 'info');
            this.populateSubjectSelects();
            this.filterAndRenderDocuments();
            this.updateDocumentStats();
        } catch (err) {
            window.showToast('Failed to delete document: ' + err.message, 'error');
        }
    }

    openDocModal(docId = null) {
        const modal = document.getElementById('docModal');
        const title = document.getElementById('docModalTitle');
        const submitBtn = document.getElementById('btnSubmitDoc');
        const subjectInput = document.getElementById('docSubject');
        const titleInput = document.getElementById('docTitle');
        const typeSelect = document.getElementById('docType');
        const urlInput = document.getElementById('docUrl');
        const contentInput = document.getElementById('docContent');
        const readTimeInput = document.getElementById('docReadTime');
        const statusSelect = document.getElementById('docStatus');

        this.editingDocId = docId;

        if (docId) {
            const doc = this.documents.find(d => d.id === docId);
            if (!doc) return;

            title.textContent = 'Edit Study Material';
            submitBtn.textContent = 'Save Changes';
            subjectInput.value = doc.subject;
            titleInput.value = doc.title;
            typeSelect.value = doc.type || 'notes';
            urlInput.value = doc.url || '';
            contentInput.value = doc.content || '';
            readTimeInput.value = doc.readTime || 15;
            statusSelect.value = doc.status || 'to_read';
        } else {
            title.textContent = 'Add Study Material / Document';
            submitBtn.textContent = 'Add Material';
            document.getElementById('docForm').reset();
            readTimeInput.value = 15;
        }

        if (modal) modal.classList.add('active');
    }

    closeDocModal() {
        const modal = document.getElementById('docModal');
        if (modal) modal.classList.remove('active');
        this.editingDocId = null;
    }

    async handleDocFormSubmit(e) {
        e.preventDefault();
        const subject = document.getElementById('docSubject').value.trim();
        const title = document.getElementById('docTitle').value.trim();
        const type = document.getElementById('docType').value;
        const url = document.getElementById('docUrl').value.trim();
        const content = document.getElementById('docContent').value.trim();
        const readTime = parseInt(document.getElementById('docReadTime').value) || 15;
        const status = document.getElementById('docStatus').value;

        if (!subject || !title) {
            window.showToast('Please provide both subject and document title.', 'error');
            return;
        }

        const docData = { subject, title, type, url, content, readTime, status };

        try {
            if (this.editingDocId) {
                // Update
                const updated = await window.api.updateDocumentStatus(this.editingDocId, status);
                const index = this.documents.findIndex(d => d.id === this.editingDocId);
                if (index !== -1) {
                    this.documents[index] = { ...this.documents[index], ...docData };
                }
                window.showToast('Document updated successfully!', 'success');
            } else {
                const created = await window.api.addDocument(docData);
                this.documents.unshift(created);
                window.showToast('Study document added to Hub!', 'success');
            }

            this.closeDocModal();
            this.populateSubjectSelects();
            this.filterAndRenderDocuments();
            this.updateDocumentStats();
        } catch (err) {
            window.showToast(err.message, 'error');
        }
    }

    // In-App Reading View
    openReaderModal(docId) {
        const doc = this.documents.find(d => d.id === docId);
        if (!doc) return;

        // If it's an external URL without notes, open directly in a new tab
        if (doc.url && !doc.content) {
            window.open(doc.url, '_blank', 'noopener,noreferrer');
            return;
        }

        const modal = document.getElementById('readerModal');
        const titleEl = document.getElementById('readerTitle');
        const subjectEl = document.getElementById('readerSubject');
        const metaEl = document.getElementById('readerMeta');
        const contentEl = document.getElementById('readerContent');
        const externalLinkBtn = document.getElementById('readerExternalLink');
        const markReadBtn = document.getElementById('readerMarkCompleteBtn');

        if (titleEl) titleEl.textContent = doc.title;
        if (subjectEl) subjectEl.textContent = doc.subject;
        if (metaEl) metaEl.textContent = `⏱️ Estimated Reading Time: ${doc.readTime || 15} minutes • Type: ${doc.type.toUpperCase()}`;
        
        if (contentEl) {
            contentEl.innerHTML = doc.content 
                ? this.escapeHtml(doc.content).replace(/\n/g, '<br>')
                : '<p style="color: var(--text-muted);">No notes attached. Click below to view the external resource.</p>';
        }

        if (externalLinkBtn) {
            if (doc.url) {
                externalLinkBtn.style.display = 'inline-flex';
                externalLinkBtn.href = doc.url;
            } else {
                externalLinkBtn.style.display = 'none';
            }
        }

        if (markReadBtn) {
            markReadBtn.onclick = () => {
                this.updateDocStatus(doc.id, 'completed');
                this.closeReaderModal();
            };
        }

        if (modal) modal.classList.add('active');
    }

    closeReaderModal() {
        const modal = document.getElementById('readerModal');
        if (modal) modal.classList.remove('active');
    }

    // ==========================================
    // ANALYTICS & OVERVIEW DASHBOARD
    // ==========================================

    async loadAnalytics() {
        try {
            const data = await window.api.getAnalytics();
            this.analyticsData = data;
            this.renderAnalytics(data);
        } catch (err) {
            console.error('Error loading analytics:', err);
        }
    }

    renderAnalytics(data) {
        if (!data) return;

        // Top metric badges
        const elStreak = document.getElementById('analyticsStreakDays');
        const elScore = document.getElementById('analyticsEfficiencyScore');
        const elTotalTime = document.getElementById('analyticsTotalStudyHours');
        const elCompletionRate = document.getElementById('analyticsCompletionRate');

        if (elStreak) elStreak.textContent = `${data.streakDays} Days 🔥`;
        if (elScore) elScore.textContent = `${data.efficiencyScore}%`;
        
        const totalMinutes = (data.tasks.totalMinutes || 0) + (data.documents.totalReadingMinutes || 0);
        const hours = (totalMinutes / 60).toFixed(1);
        if (elTotalTime) elTotalTime.textContent = `${hours} hrs`;
        if (elCompletionRate) elCompletionRate.textContent = `${data.tasks.completionRate}%`;

        // 1. Subject Distribution Bars
        const subjectBarsContainer = document.getElementById('analyticsSubjectBars');
        if (subjectBarsContainer) {
            if (data.subjects.length === 0) {
                subjectBarsContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No subject activity yet.</div>';
            } else {
                const maxMinutes = Math.max(...data.subjects.map(s => (s.studyMinutes || 0) + (s.readingMinutes || 0)), 60);

                subjectBarsContainer.innerHTML = data.subjects.map(s => {
                    const totalSubMins = (s.studyMinutes || 0) + (s.readingMinutes || 0);
                    const widthPercent = Math.min(100, Math.round((totalSubMins / maxMinutes) * 100));

                    return `
                        <div style="display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.9rem;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                                <span style="font-weight: 600;">${this.escapeHtml(s.subject)}</span>
                                <span style="color: var(--text-secondary);">${totalSubMins} mins (${s.tasksCompleted}/${s.tasksTotal} tasks done, ${s.docsRead || 0} docs read)</span>
                            </div>
                            <div class="progress-track" style="height: 10px;">
                                <div class="progress-fill" style="width: ${widthPercent}%;"></div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // 2. Reading Materials Tracker Card
        const docTrackerEl = document.getElementById('analyticsDocTracker');
        if (docTrackerEl) {
            const d = data.documents;
            docTrackerEl.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; text-align: center; margin-top: 0.5rem;">
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 0.75rem;">
                        <div style="font-size: 1.4rem; font-weight: 800; color: #10b981;">${d.completed}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Read & Finished</div>
                    </div>
                    <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 0.75rem;">
                        <div style="font-size: 1.4rem; font-weight: 800; color: #38bdf8;">${d.reading}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">Currently Reading</div>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 0.75rem;">
                        <div style="font-size: 1.4rem; font-weight: 800; color: #f59e0b;">${d.toRead}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">To Read</div>
                    </div>
                </div>
                <div style="margin-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.3rem;">
                        <span>Reading Progress</span>
                        <span style="font-weight: 700; color: var(--primary);">${d.completionRate}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${d.completionRate}%; background: linear-gradient(90deg, #6366f1, #a855f7);"></div>
                    </div>
                </div>
            `;
        }

        // 3. Priority Breakdown
        const priorityBreakdownEl = document.getElementById('analyticsPriorityBreakdown');
        if (priorityBreakdownEl) {
            const p = data.priorities;
            const total = (p.high + p.medium + p.low) || 1;
            priorityBreakdownEl.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
                        <span>🔥 High Priority</span>
                        <span style="font-weight: 700; color: #ef4444;">${p.high} tasks (${Math.round((p.high/total)*100)}%)</span>
                    </div>
                    <div class="progress-track" style="height: 8px;"><div style="height: 100%; width: ${(p.high/total)*100}%; background: #ef4444; border-radius: 999px;"></div></div>

                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
                        <span>⚡ Medium Priority</span>
                        <span style="font-weight: 700; color: #f59e0b;">${p.medium} tasks (${Math.round((p.medium/total)*100)}%)</span>
                    </div>
                    <div class="progress-track" style="height: 8px;"><div style="height: 100%; width: ${(p.medium/total)*100}%; background: #f59e0b; border-radius: 999px;"></div></div>

                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem;">
                        <span>🌱 Low Priority</span>
                        <span style="font-weight: 700; color: #10b981;">${p.low} tasks (${Math.round((p.low/total)*100)}%)</span>
                    </div>
                    <div class="progress-track" style="height: 8px;"><div style="height: 100%; width: ${(p.low/total)*100}%; background: #10b981; border-radius: 999px;"></div></div>
                </div>
            `;
        }

        // 4. Automated Study Recommendations
        const insightsEl = document.getElementById('analyticsInsights');
        if (insightsEl) {
            const insights = [];
            if (data.priorities.high > 0) {
                insights.push(`⚠️ You have <b>${data.priorities.high} High-Priority task(s)</b> pending. Tackle them during your peak focus hours!`);
            }
            if (data.documents.toRead > 0) {
                insights.push(`📖 You have <b>${data.documents.toRead} document(s) queued for reading</b>. Use Pomodoro breaks or evening sessions to complete them.`);
            }
            if (data.tasks.completionRate >= 50) {
                insights.push(`🎉 Exceptional momentum! Over half of your planned tasks are completed.`);
            } else {
                insights.push(`💡 Tip: Break large topics into 25-minute Pomodoro sessions to rapidly boost your completion score.`);
            }

            insightsEl.innerHTML = insights.map(item => `
                <div style="display: flex; gap: 0.6rem; padding: 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 8px; font-size: 0.85rem; line-height: 1.4;">
                    <div>${item}</div>
                </div>
            `).join('');
        }
    }

    // ==========================================
    // POMODORO FOCUS TIMER
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

        const circle = document.getElementById('timerProgressCircle');
        if (circle) {
            const totalCircumference = 2 * Math.PI * 90;
            const progress = this.pomodoroTimeLeft / this.pomodoroTotalTime;
            const strokeDashoffset = totalCircumference * (1 - progress);
            circle.style.strokeDashoffset = strokeDashoffset;
        }

        document.title = this.pomodoroIsRunning ? `(${formatted}) Study Planner` : 'Study Planner';
    }

    onPomodoroComplete() {
        this.pausePomodoro();
        this.playChime(880, 0.4);

        if (this.pomodoroMode === 'study') {
            window.showToast('🎯 Focus session complete! Take a well-deserved break.', 'success');
            if (this.currentPomodoroTask) {
                const completeNow = confirm(`Session complete! Mark "${this.currentPomodoroTask.topic}" as completed?`);
                if (completeNow) {
                    this.toggleTaskComplete(this.currentPomodoroTask.id);
                }
            }
            this.setPomodoroMode('shortBreak');
        } else {
            window.showToast('☕ Break finished! Ready to continue studying?', 'info');
            this.setPomodoroMode('study');
        }
    }

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
            // Audio context requires prior user interaction
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
