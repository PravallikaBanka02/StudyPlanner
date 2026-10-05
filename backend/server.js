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
                users: [],
                tasks: [],
                documents: [],
                nextTaskId: 1,
                nextDocId: 1
            };
            fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
            return initialData;
        }
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (!parsed.users) parsed.users = [];
        if (!parsed.tasks) parsed.tasks = [];
        if (!parsed.documents) parsed.documents = [];
        if (!parsed.nextTaskId) parsed.nextTaskId = (parsed.tasks.length ? Math.max(...parsed.tasks.map(t => t.id)) + 1 : 1);
        if (!parsed.nextDocId) parsed.nextDocId = (parsed.documents.length ? Math.max(...parsed.documents.map(d => d.id)) + 1 : 1);
        return parsed;
    } catch (err) {
        console.error('Error reading database file:', err);
        return { users: [], tasks: [], documents: [], nextTaskId: 1, nextDocId: 1 };
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

// ==========================================
// STUDY DOCUMENTS & READING MATERIALS ROUTES
// ==========================================

// 1. GET /api/documents (List documents with filters)
app.get('/api/documents', authenticateToken, (req, res) => {
    const db = readDb();
    let userDocs = (db.documents || []).filter(d => d.userId === req.user.id);

    const { subject, status, type, search } = req.query;

    if (search) {
        const q = search.toLowerCase();
        userDocs = userDocs.filter(d => 
            (d.title && d.title.toLowerCase().includes(q)) ||
            (d.subject && d.subject.toLowerCase().includes(q)) ||
            (d.content && d.content.toLowerCase().includes(q))
        );
    }

    if (subject && subject !== 'all') {
        userDocs = userDocs.filter(d => d.subject.toLowerCase() === subject.toLowerCase());
    }

    if (status && status !== 'all') {
        userDocs = userDocs.filter(d => d.status === status);
    }

    if (type && type !== 'all') {
        userDocs = userDocs.filter(d => d.type === type);
    }

    userDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ documents: userDocs, total: userDocs.length });
});

// 2. POST /api/documents (Add study document / reading resource)
app.post('/api/documents', authenticateToken, (req, res) => {
    const { subject, title, type, url, content, readTime, status } = req.body;

    if (!subject || !title) {
        return res.status(400).json({ error: 'Subject and Document Title are required.' });
    }

    const db = readDb();
    if (!db.documents) db.documents = [];
    if (!db.nextDocId) db.nextDocId = 1;

    const newDoc = {
        id: db.nextDocId++,
        userId: req.user.id,
        subject: subject.trim(),
        title: title.trim(),
        type: type || 'notes', // notes, pdf, article, book
        url: url ? url.trim() : '',
        content: content ? content.trim() : '',
        readTime: parseInt(readTime) || 15, // in minutes
        status: status || 'to_read', // to_read, reading, completed
        createdAt: new Date().toISOString()
    };

    db.documents.push(newDoc);
    writeDb(db);

    return res.status(201).json({
        message: 'Reading document added successfully!',
        document: newDoc
    });
});

// 3. PATCH /api/documents/:id/status (Update reading status)
app.patch('/api/documents/:id/status', authenticateToken, (req, res) => {
    const docId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['to_read', 'reading', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid reading status.' });
    }

    const db = readDb();
    const docIndex = (db.documents || []).findIndex(d => d.id === docId && d.userId === req.user.id);

    if (docIndex === -1) {
        return res.status(404).json({ error: 'Document not found.' });
    }

    db.documents[docIndex].status = status;
    db.documents[docIndex].updatedAt = new Date().toISOString();
    writeDb(db);

    return res.json({
        message: 'Reading status updated!',
        document: db.documents[docIndex]
    });
});

// 4. PUT /api/documents/:id (Update document)
app.put('/api/documents/:id', authenticateToken, (req, res) => {
    const docId = parseInt(req.params.id);
    const { subject, title, type, url, content, readTime, status } = req.body;

    const db = readDb();
    const docIndex = (db.documents || []).findIndex(d => d.id === docId && d.userId === req.user.id);

    if (docIndex === -1) {
        return res.status(404).json({ error: 'Document not found.' });
    }

    if (subject) db.documents[docIndex].subject = subject.trim();
    if (title) db.documents[docIndex].title = title.trim();
    if (type) db.documents[docIndex].type = type;
    if (url !== undefined) db.documents[docIndex].url = url.trim();
    if (content !== undefined) db.documents[docIndex].content = content.trim();
    if (readTime !== undefined) db.documents[docIndex].readTime = parseInt(readTime) || 15;
    if (status) db.documents[docIndex].status = status;
    db.documents[docIndex].updatedAt = new Date().toISOString();

    writeDb(db);

    return res.json({
        message: 'Document updated successfully!',
        document: db.documents[docIndex]
    });
});

// 5. DELETE /api/documents/:id (Delete document)
app.delete('/api/documents/:id', authenticateToken, (req, res) => {
    const docId = parseInt(req.params.id);
    const db = readDb();

    const docIndex = (db.documents || []).findIndex(d => d.id === docId && d.userId === req.user.id);

    if (docIndex === -1) {
        return res.status(404).json({ error: 'Document not found.' });
    }

    db.documents.splice(docIndex, 1);
    writeDb(db);

    return res.json({ message: 'Document deleted successfully!' });
});

// ==========================================
// COMPREHENSIVE ANALYTICS & OVERVIEW ROUTE
// ==========================================
app.get('/api/analytics', authenticateToken, (req, res) => {
    const db = readDb();
    const userTasks = (db.tasks || []).filter(t => t.userId === req.user.id);
    const userDocs = (db.documents || []).filter(d => d.userId === req.user.id);

    // Task stats
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.completed === 1 || t.completed === true).length;
    const pendingTasks = totalTasks - completedTasks;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Study minutes
    const totalStudyMinutes = userTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const completedStudyMinutes = userTasks
        .filter(t => t.completed === 1 || t.completed === true)
        .reduce((sum, t) => sum + (t.duration || 0), 0);

    // Priorities
    const priorityBreakdown = {
        high: userTasks.filter(t => t.priority === 3).length,
        medium: userTasks.filter(t => t.priority === 2).length,
        low: userTasks.filter(t => t.priority === 1).length
    };

    // Document reading stats
    const totalDocs = userDocs.length;
    const readDocs = userDocs.filter(d => d.status === 'completed').length;
    const readingDocs = userDocs.filter(d => d.status === 'reading').length;
    const toReadDocs = userDocs.filter(d => d.status === 'to_read').length;
    const totalReadingMinutes = userDocs.reduce((sum, d) => sum + (d.readTime || 0), 0);
    const completedReadingMinutes = userDocs
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + (d.readTime || 0), 0);
    const readingCompletionRate = totalDocs > 0 ? Math.round((readDocs / totalDocs) * 100) : 0;

    // Subject consolidated breakdown
    const subjectMap = {};
    userTasks.forEach(t => {
        if (!subjectMap[t.subject]) {
            subjectMap[t.subject] = { subject: t.subject, tasksTotal: 0, tasksCompleted: 0, studyMinutes: 0, docsTotal: 0, docsRead: 0, readingMinutes: 0 };
        }
        subjectMap[t.subject].tasksTotal++;
        if (t.completed === 1 || t.completed === true) subjectMap[t.subject].tasksCompleted++;
        subjectMap[t.subject].studyMinutes += (t.duration || 0);
    });

    userDocs.forEach(d => {
        if (!subjectMap[d.subject]) {
            subjectMap[d.subject] = { subject: d.subject, tasksTotal: 0, tasksCompleted: 0, studyMinutes: 0, docsTotal: 0, docsRead: 0, readingMinutes: 0 };
        }
        subjectMap[d.subject].docsTotal++;
        if (d.status === 'completed') subjectMap[d.subject].docsRead++;
        subjectMap[d.subject].readingMinutes += (d.readTime || 0);
    });

    // Efficiency Score (combined task + reading progress + consistency, 0-100)
    let efficiencyScore = 80;
    if (totalTasks > 0 || totalDocs > 0) {
        const tWeight = totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 30;
        const dWeight = totalDocs > 0 ? (readDocs / totalDocs) * 40 : 20;
        efficiencyScore = Math.min(100, Math.round(tWeight + dWeight));
    }

    return res.json({
        tasks: {
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            completionRate: taskCompletionRate,
            totalMinutes: totalStudyMinutes,
            completedMinutes: completedStudyMinutes
        },
        priorities: priorityBreakdown,
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
        streakDays: 4, // Simulated study streak
        efficiencyScore
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
