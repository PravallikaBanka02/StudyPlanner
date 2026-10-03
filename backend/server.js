const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'study-planner-secret-key-xyz-2026';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
const frontendPath = path.join(__dirname, '..', 'frontend');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
}

// Data directory & storage setup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database helper functions
function readDb() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            const initialData = {
                users: [
                    {
                        id: 'demo-user-1',
                        name: 'Alex Morgan',
                        email: 'alex@example.com',
                        passwordHash: hashPassword('password123', 'demosalt'),
                        salt: 'demosalt',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                        provider: 'email',
                        createdAt: new Date().toISOString()
                    }
                ],
                tasks: [
                    {
                        id: 1,
                        userId: 'demo-user-1',
                        subject: 'Computer Science',
                        topic: 'Process Scheduling Algorithms',
                        duration: 60,
                        priority: 3, // 3 = High
                        completed: 1,
                        createdAt: new Date(Date.now() - 86400000).toISOString()
                    },
                    {
                        id: 2,
                        userId: 'demo-user-1',
                        subject: 'Mathematics',
                        topic: 'Eigenvalues and Eigenvectors',
                        duration: 90,
                        priority: 2, // 2 = Medium
                        completed: 0,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 3,
                        userId: 'demo-user-1',
                        subject: 'Physics',
                        topic: 'Quantum Wave Functions',
                        duration: 45,
                        priority: 3, // 3 = High
                        completed: 0,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 4,
                        userId: 'demo-user-1',
                        subject: 'English Literature',
                        topic: 'Shakespearean Sonnets Analysis',
                        duration: 30,
                        priority: 1, // 1 = Low
                        completed: 0,
                        createdAt: new Date().toISOString()
                    }
                ],
                nextTaskId: 5
            };
            fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
            return initialData;
        }
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading database file:', err);
        return { users: [], tasks: [], nextTaskId: 1 };
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error writing to database:', err);
    }
}

// Password hashing helper (no native dependencies required)
function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Auth Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register with Email & Password
app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const db = readDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newUser = {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        salt,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=4f46e5`,
        provider: 'email',
        createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    // Add starter tasks based on C code concepts
    const starterTasks = [
        {
            id: db.nextTaskId++,
            userId: newUser.id,
            subject: 'Mathematics',
            topic: 'Calculus Review & Problem Sets',
            duration: 60,
            priority: 2,
            completed: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: db.nextTaskId++,
            userId: newUser.id,
            subject: 'Computer Science',
            topic: 'Data Structures & Algorithms',
            duration: 90,
            priority: 3,
            completed: 0,
            createdAt: new Date().toISOString()
        }
    ];

    db.tasks.push(...starterTasks);
    writeDb(db);

    const token = jwt.sign(
        { id: newUser.id, email: newUser.email, name: newUser.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    return res.status(201).json({
        message: 'Account created successfully!',
        token,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            avatar: newUser.avatar,
            provider: newUser.provider
        }
    });
});

// Login with Email & Password
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = readDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        return res.status(400).json({ error: 'Invalid email or password.' });
    }

    if (user.provider === 'google' && !user.passwordHash) {
        return res.status(400).json({ error: 'This account was created with Google. Please use Google Sign-In.' });
    }

    const checkHash = hashPassword(password, user.salt);
    if (checkHash !== user.passwordHash) {
        return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    return res.json({
        message: 'Login successful!',
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            provider: user.provider
        }
    });
});

// Google Sign-In / OAuth Handler
app.post('/api/auth/google', (req, res) => {
    const { email, name, picture, googleId } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required for Google Sign-In.' });
    }

    const db = readDb();
    let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        // Create new user via Google
        const userId = 'google_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        user = {
            id: userId,
            name: name || email.split('@')[0],
            email: email.toLowerCase(),
            avatar: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}&backgroundColor=4f46e5`,
            googleId: googleId || 'demo_google_id',
            provider: 'google',
            createdAt: new Date().toISOString()
        };

        db.users.push(user);

        // Add default tasks
        db.tasks.push({
            id: db.nextTaskId++,
            userId: user.id,
            subject: 'Computer Science',
            topic: 'System Architecture & Memory Management',
            duration: 60,
            priority: 3,
            completed: 0,
            createdAt: new Date().toISOString()
        });

        writeDb(db);
    } else {
        // Update user profile info if provided
        if (picture && !user.avatar) user.avatar = picture;
        if (!user.provider) user.provider = 'google';
        writeDb(db);
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    return res.json({
        message: 'Google Sign-In successful!',
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            provider: user.provider
        }
    });
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const db = readDb();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            provider: user.provider,
            createdAt: user.createdAt
        }
    });
});

// ==========================================
// STUDY TASK ROUTES (Mapped from C Program)
// ==========================================

// 1. GET /api/tasks (View study tasks with search & filter)
app.get('/api/tasks', authenticateToken, (req, res) => {
    const db = readDb();
    let userTasks = db.tasks.filter(t => t.userId === req.user.id);

    const { search, priority, status, subject } = req.query;

    if (search) {
        const query = search.toLowerCase();
        userTasks = userTasks.filter(t => 
            t.subject.toLowerCase().includes(query) || 
            t.topic.toLowerCase().includes(query)
        );
    }

    if (priority && priority !== 'all') {
        userTasks = userTasks.filter(t => t.priority === parseInt(priority));
    }

    if (status && status !== 'all') {
        if (status === 'completed') {
            userTasks = userTasks.filter(t => t.completed === 1 || t.completed === true);
        } else if (status === 'pending') {
            userTasks = userTasks.filter(t => t.completed === 0 || t.completed === false);
        }
    }

    if (subject && subject !== 'all') {
        userTasks = userTasks.filter(t => t.subject.toLowerCase() === subject.toLowerCase());
    }

    // Default sorting: Pending high-priority first, then by creation date
    userTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed - b.completed;
        if (b.priority !== a.priority) return b.priority - a.priority;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.json({
        tasks: userTasks,
        total: userTasks.length
    });
});

// 2. POST /api/tasks (Add Study Task - matching void addTask())
app.post('/api/tasks', authenticateToken, (req, res) => {
    const { subject, topic, duration, priority } = req.body;

    if (!subject || !topic) {
        return res.status(400).json({ error: 'Subject and Topic are required.' });
    }

    const parsedDuration = parseInt(duration) || 30;
    const parsedPriority = [1, 2, 3].includes(parseInt(priority)) ? parseInt(priority) : 2;

    const db = readDb();
    
    // Check max tasks per user (matching MAX_TASKS = 100 in C)
    const userTaskCount = db.tasks.filter(t => t.userId === req.user.id).length;
    if (userTaskCount >= 100) {
        return res.status(400).json({ error: 'Task limit reached (Maximum 100 tasks allowed).' });
    }

    const newTask = {
        id: db.nextTaskId++,
        userId: req.user.id,
        subject: subject.trim(),
        topic: topic.trim(),
        duration: parsedDuration, // in minutes
        priority: parsedPriority, // 1 = Low, 2 = Medium, 3 = High
        completed: 0,
        createdAt: new Date().toISOString()
    };

    db.tasks.push(newTask);
    writeDb(db);

    return res.status(201).json({
        message: 'Task added successfully!',
        task: newTask
    });
});

// 3. PATCH /api/tasks/:id/complete (Toggle Task - matching void completeTask())
app.patch('/api/tasks/:id/complete', authenticateToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const db = readDb();

    const taskIndex = db.tasks.findIndex(t => t.id === taskId && t.userId === req.user.id);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found.' });
    }

    // Toggle completed (or set based on body if provided)
    if (req.body.completed !== undefined) {
        db.tasks[taskIndex].completed = req.body.completed ? 1 : 0;
    } else {
        db.tasks[taskIndex].completed = db.tasks[taskIndex].completed === 1 ? 0 : 1;
    }

    writeDb(db);

    return res.json({
        message: db.tasks[taskIndex].completed ? 'Task marked as completed!' : 'Task marked as pending.',
        task: db.tasks[taskIndex]
    });
});

// 4. PUT /api/tasks/:id (Edit Task)
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const { subject, topic, duration, priority, completed } = req.body;

    const db = readDb();
    const taskIndex = db.tasks.findIndex(t => t.id === taskId && t.userId === req.user.id);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found.' });
    }

    if (subject) db.tasks[taskIndex].subject = subject.trim();
    if (topic) db.tasks[taskIndex].topic = topic.trim();
    if (duration !== undefined) db.tasks[taskIndex].duration = parseInt(duration) || 0;
    if (priority !== undefined) db.tasks[taskIndex].priority = parseInt(priority) || 1;
    if (completed !== undefined) db.tasks[taskIndex].completed = completed ? 1 : 0;
    db.tasks[taskIndex].updatedAt = new Date().toISOString();

    writeDb(db);

    return res.json({
        message: 'Task updated successfully!',
        task: db.tasks[taskIndex]
    });
});

// 5. DELETE /api/tasks/:id (Delete Task - matching void deleteTask())
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const db = readDb();

    const taskIndex = db.tasks.findIndex(t => t.id === taskId && t.userId === req.user.id);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found.' });
    }

    db.tasks.splice(taskIndex, 1);
    writeDb(db);

    return res.json({
        message: 'Task deleted successfully!'
    });
});

// 6. GET /api/stats (Study Statistics & Dashboard Analytics)
app.get('/api/stats', authenticateToken, (req, res) => {
    const db = readDb();
    const userTasks = db.tasks.filter(t => t.userId === req.user.id);

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.completed === 1 || t.completed === true).length;
    const pendingTasks = totalTasks - completedTasks;
    const totalDurationMinutes = userTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const completedDurationMinutes = userTasks
        .filter(t => t.completed === 1 || t.completed === true)
        .reduce((sum, t) => sum + (t.duration || 0), 0);
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Subject breakdown
    const subjectMap = {};
    userTasks.forEach(t => {
        if (!subjectMap[t.subject]) {
            subjectMap[t.subject] = { count: 0, completed: 0, totalMinutes: 0 };
        }
        subjectMap[t.subject].count++;
        if (t.completed === 1) subjectMap[t.subject].completed++;
        subjectMap[t.subject].totalMinutes += (t.duration || 0);
    });

    return res.json({
        totalTasks,
        completedTasks,
        pendingTasks,
        totalDurationMinutes,
        completedDurationMinutes,
        completionRate,
        subjects: subjectMap
    });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({ message: 'Study Planner REST API is active.' });
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`   STUDY PLANNER SERVER RUNNING ON PORT ${PORT} `);
    console.log(`   URL: http://0.0.0.0:${PORT}                   `);
    console.log(`===============================================`);
});
