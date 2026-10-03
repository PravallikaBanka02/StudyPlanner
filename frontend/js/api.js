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

        // Seed initial tasks matching the C program
        this._initLocalTasks(newUser.id);

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

        // Support default demo account locally
        if (email.toLowerCase() === 'alex@example.com' && password === 'password123') {
            const demoUser = {
                id: 'demo-user-1',
                name: 'Alex Morgan',
                email: 'alex@example.com',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                provider: 'email'
            };
            this.setToken('local_demo_token');
            localStorage.setItem('study_current_user', JSON.stringify(demoUser));
            this._initLocalTasks(demoUser.id);
            return { token: 'local_demo_token', user: demoUser };
        }

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
        this._initLocalTasks(googleUser.id);

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

    _initLocalTasks(userId) {
        const existing = localStorage.getItem('study_local_tasks');
        if (!existing || JSON.parse(existing).length === 0) {
            const defaults = [
                {
                    id: 1,
                    userId,
                    subject: 'Computer Science',
                    topic: 'Process Scheduling Algorithms (Round Robin & FCFS)',
                    duration: 60,
                    priority: 3, // High
                    completed: 1,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    userId,
                    subject: 'Mathematics',
                    topic: 'Eigenvalues, Eigenvectors & Linear Transformations',
                    duration: 90,
                    priority: 2, // Medium
                    completed: 0,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    userId,
                    subject: 'Physics',
                    topic: 'Schrodinger Wave Equation & Quantum States',
                    duration: 45,
                    priority: 3, // High
                    completed: 0,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 4,
                    userId,
                    subject: 'Data Structures',
                    topic: 'Binary Search Trees & AVL Rotations',
                    duration: 50,
                    priority: 2, // Medium
                    completed: 0,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 5,
                    userId,
                    subject: 'Database Systems',
                    topic: 'ACID Properties and B+ Tree Indexing',
                    duration: 40,
                    priority: 1, // Low
                    completed: 0,
                    createdAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('study_local_tasks', JSON.stringify(defaults));
        }
    }
}

// Export singleton instance
window.api = new ApiService();
