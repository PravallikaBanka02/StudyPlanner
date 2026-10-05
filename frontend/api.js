/**
 * API Client & Storage Bridge
 * Seamlessly connects to the Express REST API, with intelligent fallback to LocalStorage
 * so the application works both standalone in the browser and with the Node.js backend!
 */

// Automatically use relative path '/api' when hosted on Render or server, otherwise localhost
const isLocalFile = window.location.protocol === 'file:';
const isOtherLocalPort = window.location.hostname === 'localhost' && window.location.port !== '5000' && window.location.port !== '';
const API_BASE_URL = (isLocalFile || isOtherLocalPort)
    ? 'http://localhost:5000/api'
    : '/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('study_planner_token') || null;
        this.isBackendOnline = false;
        this.checkBackendConnection();
    }

    async checkBackendConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);
            
            const res = await fetch(`${API_BASE_URL}/stats`, {
                method: 'GET',
                headers: this.getHeaders(),
                signal: controller.signal
            }).catch(() => null);

            clearTimeout(timeoutId);

            if (res && (res.status === 200 || res.status === 401 || res.status === 403)) {
                this.isBackendOnline = true;
            } else {
                this.isBackendOnline = false;
            }
        } catch {
            this.isBackendOnline = false;
        }

        const badge = document.getElementById('backendStatusBadge');
        if (badge) {
            if (this.isBackendOnline) {
                badge.innerHTML = '<span class="status-dot online"></span> API Server Connected';
                badge.classList.remove('offline');
                badge.classList.add('online');
            } else {
                badge.innerHTML = '<span class="status-dot offline"></span> Local Offline Mode';
                badge.classList.remove('online');
                badge.classList.add('offline');
            }
        }
        return this.isBackendOnline;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('study_planner_token', token);
        } else {
            localStorage.removeItem('study_planner_token');
        }
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // ==========================================
    // AUTH METHODS
    // ==========================================
    async register(name, email, password) {
        if (this.isBackendOnline) {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to register');
                this.setToken(data.token);
                return data;
            } catch (err) {
                console.warn('Backend register failed, trying local mode:', err.message);
            }
        }

        // LocalStorage Fallback
        const users = JSON.parse(localStorage.getItem('study_local_users') || '[]');
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error('An account with this email already exists.');
        }

        const newUser = {
            id: 'local_user_' + Date.now(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5`,
            provider: 'email'
        };
        users.push({ ...newUser, password });
        localStorage.setItem('study_local_users', JSON.stringify(users));

        const dummyToken = 'local_token_' + Date.now();
        this.setToken(dummyToken);
        localStorage.setItem('study_current_user', JSON.stringify(newUser));

        return { token: dummyToken, user: newUser };
    }

    async login(email, password) {
        if (this.isBackendOnline) {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Invalid credentials');
                this.setToken(data.token);
                return data;
            } catch (err) {
                if (this.isBackendOnline) throw err;
            }
        }

        // LocalStorage Fallback
        const users = JSON.parse(localStorage.getItem('study_local_users') || '[]');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user || user.password !== password) {
            throw new Error('Invalid email or password.');
        }

        const authUser = { id: user.id, name: user.name, email: user.email, avatar: user.avatar, provider: user.provider };
        const dummyToken = 'local_token_' + Date.now();
        this.setToken(dummyToken);
        localStorage.setItem('study_current_user', JSON.stringify(authUser));
        return { token: dummyToken, user: authUser };
    }

    async googleAuth(profile) {
        if (this.isBackendOnline) {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profile)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Google authentication failed');
                this.setToken(data.token);
                return data;
            } catch (err) {
                console.warn('Backend Google Auth failed, falling back to local:', err);
            }
        }

        // LocalStorage Fallback for Google Sign-in
        const googleUser = {
            id: 'google_' + (profile.googleId || Date.now()),
            name: profile.name || 'Google User',
            email: profile.email || 'user@gmail.com',
            avatar: profile.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'Google')}&backgroundColor=4f46e5`,
            provider: 'google'
        };

        const dummyToken = 'local_google_token_' + Date.now();
        this.setToken(dummyToken);
        localStorage.setItem('study_current_user', JSON.stringify(googleUser));

        return { token: dummyToken, user: googleUser };
    }

    async getCurrentUser() {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: this.getHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.user;
                }
            } catch (e) {
                console.warn('Failed to fetch user from backend:', e);
            }
        }

        // Check local storage
        const savedUser = localStorage.getItem('study_current_user');
        return savedUser ? JSON.parse(savedUser) : null;
    }

    logout() {
        this.setToken(null);
        localStorage.removeItem('study_current_user');
    }

    // ==========================================
    // TASK CRUD METHODS (Based on C Functions)
    // ==========================================

    async getTasks(params = {}) {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const query = new URLSearchParams();
                if (params.search) query.append('search', params.search);
                if (params.priority && params.priority !== 'all') query.append('priority', params.priority);
                if (params.status && params.status !== 'all') query.append('status', params.status);
                if (params.subject && params.subject !== 'all') query.append('subject', params.subject);

                const res = await fetch(`${API_BASE_URL}/tasks?${query.toString()}`, {
                    headers: this.getHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.tasks;
                }
            } catch (err) {
                console.warn('Error fetching tasks from backend, using local:', err);
            }
        }

        // Local Storage retrieval
        let tasks = JSON.parse(localStorage.getItem('study_local_tasks') || '[]');
        const user = await this.getCurrentUser();
        const userId = user ? user.id : 'demo-user-1';

        tasks = tasks.filter(t => t.userId === userId);

        if (params.search) {
            const q = params.search.toLowerCase();
            tasks = tasks.filter(t => 
                (t.subject && t.subject.toLowerCase().includes(q)) || 
                (t.topic && t.topic.toLowerCase().includes(q))
            );
        }

        if (params.priority && params.priority !== 'all') {
            tasks = tasks.filter(t => t.priority === parseInt(params.priority));
        }

        if (params.status && params.status !== 'all') {
            if (params.status === 'completed') tasks = tasks.filter(t => t.completed === 1);
            if (params.status === 'pending') tasks = tasks.filter(t => t.completed === 0);
        }

        if (params.subject && params.subject !== 'all') {
            tasks = tasks.filter(t => t.subject.toLowerCase() === params.subject.toLowerCase());
        }

        // Sort: pending high-priority first
        return tasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed - b.completed;
            if (b.priority !== a.priority) return b.priority - a.priority;
            return b.id - a.id;
        });
    }

    async addTask(taskData) {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const res = await fetch(`${API_BASE_URL}/tasks`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(taskData)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to add task');
                return data.task;
            } catch (err) {
                if (this.isBackendOnline) throw err;
            }
        }

        // Local Storage addTask (similar to addTask() in C)
        const allTasks = JSON.parse(localStorage.getItem('study_local_tasks') || '[]');
        const user = await this.getCurrentUser();
        const userId = user ? user.id : 'demo-user-1';

        const userTasks = allTasks.filter(t => t.userId === userId);
        if (userTasks.length >= 100) {
            throw new Error('Task limit reached! (Maximum 100 tasks allowed)');
        }

        const newTask = {
            id: Date.now(),
            userId,
            subject: taskData.subject.trim(),
            topic: taskData.topic.trim(),
            duration: parseInt(taskData.duration) || 30,
            priority: parseInt(taskData.priority) || 2,
            completed: 0,
            createdAt: new Date().toISOString()
        };

        allTasks.push(newTask);
        localStorage.setItem('study_local_tasks', JSON.stringify(allTasks));
        return newTask;
    }

    async toggleComplete(id) {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const res = await fetch(`${API_BASE_URL}/tasks/${id}/complete`, {
                    method: 'PATCH',
                    headers: this.getHeaders()
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to toggle status');
                return data.task;
            } catch (err) {
                if (this.isBackendOnline) throw err;
            }
        }

        // Local completeTask()
        const allTasks = JSON.parse(localStorage.getItem('study_local_tasks') || '[]');
        const task = allTasks.find(t => t.id === id);
        if (!task) throw new Error('Task not found.');

        task.completed = task.completed === 1 ? 0 : 1;
        localStorage.setItem('study_local_tasks', JSON.stringify(allTasks));
        return task;
    }

    async deleteTask(id) {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                    method: 'DELETE',
                    headers: this.getHeaders()
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to delete task');
                return true;
            } catch (err) {
                if (this.isBackendOnline) throw err;
            }
        }

        // Local deleteTask()
        let allTasks = JSON.parse(localStorage.getItem('study_local_tasks') || '[]');
        allTasks = allTasks.filter(t => t.id !== id);
        localStorage.setItem('study_local_tasks', JSON.stringify(allTasks));
        return true;
    }

    async updateTask(id, taskData) {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                    method: 'PUT',
                    headers: this.getHeaders(),
                    body: JSON.stringify(taskData)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to update task');
                return data.task;
            } catch (err) {
                if (this.isBackendOnline) throw err;
            }
        }

        const allTasks = JSON.parse(localStorage.getItem('study_local_tasks') || '[]');
        const task = allTasks.find(t => t.id === id);
        if (!task) throw new Error('Task not found.');

        if (taskData.subject) task.subject = taskData.subject;
        if (taskData.topic) task.topic = taskData.topic;
        if (taskData.duration !== undefined) task.duration = parseInt(taskData.duration);
        if (taskData.priority !== undefined) task.priority = parseInt(taskData.priority);

        localStorage.setItem('study_local_tasks', JSON.stringify(allTasks));
        return task;
    }

    // ==========================================
    // STUDY DOCUMENTS & READING MATERIALS API
    // ==========================================

    async getDocuments(params = {}) {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const query = new URLSearchParams();
                if (params.search) query.append('search', params.search);
                if (params.subject && params.subject !== 'all') query.append('subject', params.subject);
                if (params.status && params.status !== 'all') query.append('status', params.status);
                if (params.type && params.type !== 'all') query.append('type', params.type);

                const res = await fetch(`${API_BASE_URL}/documents?${query.toString()}`, {
                    headers: this.getHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.documents;
                }
            } catch (err) {
                console.warn('Error fetching documents from backend:', err);
            }
        }

        // Local Storage fallback
        let docs = JSON.parse(localStorage.getItem('study_local_docs') || '[]');
        const user = await this.getCurrentUser();
        const userId = user ? user.id : 'demo-user-1';

        docs = docs.filter(d => d.userId === userId);

        if (params.search) {
            const q = params.search.toLowerCase();
            docs = docs.filter(d =>
                (d.title && d.title.toLowerCase().includes(q)) ||
                (d.subject && d.subject.toLowerCase().includes(q)) ||
                (d.content && d.content.toLowerCase().includes(q))
            );
        }

        if (params.subject && params.subject !== 'all') {
            docs = docs.filter(d => d.subject.toLowerCase() === params.subject.toLowerCase());
        }

        if (params.status && params.status !== 'all') {
            docs = docs.filter(d => d.status === params.status);
        }

        if (params.type && params.type !== 'all') {
            docs = docs.filter(d => d.type === params.type);
        }

        return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async addDocument(docData) {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const res = await fetch(`${API_BASE_URL}/documents`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(docData)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to add document');
                return data.document;
            } catch (err) {
                if (this.isBackendOnline) throw err;
            }
        }

        const allDocs = JSON.parse(localStorage.getItem('study_local_docs') || '[]');
        const user = await this.getCurrentUser();
        const userId = user ? user.id : 'demo-user-1';

        const newDoc = {
            id: Date.now(),
            userId,
            subject: docData.subject.trim(),
            title: docData.title.trim(),
            type: docData.type || 'notes',
            url: docData.url ? docData.url.trim() : '',
            content: docData.content ? docData.content.trim() : '',
            readTime: parseInt(docData.readTime) || 15,
            status: docData.status || 'to_read',
            createdAt: new Date().toISOString()
        };

        allDocs.unshift(newDoc);
        localStorage.setItem('study_local_docs', JSON.stringify(allDocs));
        return newDoc;
    }

    async updateDocumentStatus(id, status) {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const res = await fetch(`${API_BASE_URL}/documents/${id}/status`, {
                    method: 'PATCH',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ status })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to update status');
                return data.document;
            } catch (err) {
                if (this.isBackendOnline) throw err;
            }
        }

        const allDocs = JSON.parse(localStorage.getItem('study_local_docs') || '[]');
        const doc = allDocs.find(d => d.id === id);
        if (!doc) throw new Error('Document not found');

        doc.status = status;
        localStorage.setItem('study_local_docs', JSON.stringify(allDocs));
        return doc;
    }

    async deleteDocument(id) {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
                    method: 'DELETE',
                    headers: this.getHeaders()
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to delete document');
                return true;
            } catch (err) {
                if (this.isBackendOnline) throw err;
            }
        }

        let allDocs = JSON.parse(localStorage.getItem('study_local_docs') || '[]');
        allDocs = allDocs.filter(d => d.id !== id);
        localStorage.setItem('study_local_docs', JSON.stringify(allDocs));
        return true;
    }

    async getAnalytics() {
        if (this.isBackendOnline && this.token && !this.token.startsWith('local_')) {
            try {
                const res = await fetch(`${API_BASE_URL}/analytics`, {
                    headers: this.getHeaders()
                });
                if (res.ok) {
                    return await res.json();
                }
            } catch (err) {
                console.warn('Backend analytics failed, computing locally:', err);
            }
        }

        // Local Analytics calculation
        const tasks = await this.getTasks();
        const docs = await this.getDocuments();

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed === 1 || t.completed === true).length;
        const pendingTasks = totalTasks - completedTasks;
        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const totalMinutes = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
        const completedMinutes = tasks.filter(t => t.completed === 1 || t.completed === true).reduce((sum, t) => sum + (t.duration || 0), 0);

        const totalDocs = docs.length;
        const readDocs = docs.filter(d => d.status === 'completed').length;
        const readingDocs = docs.filter(d => d.status === 'reading').length;
        const toReadDocs = docs.filter(d => d.status === 'to_read').length;
        const totalReadingMinutes = docs.reduce((sum, d) => sum + (d.readTime || 0), 0);
        const completedReadingMinutes = docs.filter(d => d.status === 'completed').reduce((sum, d) => sum + (d.readTime || 0), 0);
        const readingCompletionRate = totalDocs > 0 ? Math.round((readDocs / totalDocs) * 100) : 0;

        const subjectMap = {};
        tasks.forEach(t => {
            if (!subjectMap[t.subject]) subjectMap[t.subject] = { subject: t.subject, tasksTotal: 0, tasksCompleted: 0, studyMinutes: 0, docsTotal: 0, docsRead: 0, readingMinutes: 0 };
            subjectMap[t.subject].tasksTotal++;
            if (t.completed === 1) subjectMap[t.subject].tasksCompleted++;
            subjectMap[t.subject].studyMinutes += (t.duration || 0);
        });

        docs.forEach(d => {
            if (!subjectMap[d.subject]) subjectMap[d.subject] = { subject: d.subject, tasksTotal: 0, tasksCompleted: 0, studyMinutes: 0, docsTotal: 0, docsRead: 0, readingMinutes: 0 };
            subjectMap[d.subject].docsTotal++;
            if (d.status === 'completed') subjectMap[d.subject].docsRead++;
            subjectMap[d.subject].readingMinutes += (d.readTime || 0);
        });

        const hasActivity = totalTasks > 0 || totalDocs > 0;
        const efficiencyScore = hasActivity
            ? Math.min(100, Math.round(
                (totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 0) +
                (totalDocs > 0 ? (readDocs / totalDocs) * 40 : 0)
            ))
            : 0;

        return {
            tasks: {
                total: totalTasks,
                completed: completedTasks,
                pending: pendingTasks,
                completionRate: taskCompletionRate,
                totalMinutes,
                completedMinutes
            },
            priorities: {
                high: tasks.filter(t => t.priority === 3).length,
                medium: tasks.filter(t => t.priority === 2).length,
                low: tasks.filter(t => t.priority === 1).length
            },
            documents: {
                total: totalDocs,
                completed: readDocs,
                reading: readingDocs,
                toRead: toReadDocs,
                completionRate: readingCompletionRate,
                totalReadingMinutes,
                completedReadingMinutes
            },
            subjects: Object.values(subjectMap),
            streakDays: hasActivity ? 1 : 0,
            efficiencyScore
        };
    }
}

// Export singleton instance
window.api = new ApiService();

