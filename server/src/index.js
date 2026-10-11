const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  readData, 
  writeData, 
  ensureDir, 
  isTestingAccount, 
  getSeedDataForTestUser 
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup directories
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
ensureDir(UPLOADS_DIR);

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureDir(UPLOADS_DIR);
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper to get user from header
function getUserId(req) {
  return req.headers['x-user-id'] || null;
}

/* ==========================================================
   AUTHENTICATION ROUTES (Email & Google Account)
   ========================================================== */

// Email Login / Signup
app.post('/api/auth/login', (req, res) => {
  const { email, password, name, isTesting } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const db = readData();
  const normalizedEmail = email.toLowerCase().trim();
  let user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  const shouldSeed = isTestingAccount(normalizedEmail) || Boolean(isTesting);

  if (!user) {
    // Auto-create on first sign-in
    const userName = name || email.split('@')[0];
    user = {
      id: 'usr_' + Date.now(),
      email: normalizedEmail,
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&backgroundColor=6366f1`,
      provider: 'email',
      isTestingAccount: shouldSeed,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);

    // ONLY add dummy seed data if it's explicitly a testing account!
    if (shouldSeed) {
      const seed = getSeedDataForTestUser(user.id);
      db.tasks.push(...seed.tasks);
      db.sessions.push(...seed.sessions);
      db.documents.push(...seed.documents);
    }

    writeData(db);
  }

  res.json({
    message: 'Login successful',
    token: 'jwt_mock_token_' + user.id,
    user
  });
});

// Google Sign-In
app.post('/api/auth/google', (req, res) => {
  const { email, name, avatar, googleId, isTesting } = req.body;
  const userEmail = (email || 'google.user@example.com').toLowerCase().trim();
  const userName = name || 'Google Scholar';

  const db = readData();
  let user = db.users.find(u => u.email.toLowerCase() === userEmail);

  const shouldSeed = isTestingAccount(userEmail) || Boolean(isTesting);

  if (!user) {
    user = {
      id: 'usr_g_' + (googleId || Date.now()),
      email: userEmail,
      name: userName,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`,
      provider: 'google',
      isTestingAccount: shouldSeed,
      googleId: googleId || 'g_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    db.users.push(user);

    // ONLY add dummy seed data if it's explicitly a testing account!
    if (shouldSeed) {
      const seed = getSeedDataForTestUser(user.id);
      db.tasks.push(...seed.tasks);
      db.sessions.push(...seed.sessions);
      db.documents.push(...seed.documents);
    }

    writeData(db);
  }

  res.json({
    message: 'Google authentication successful',
    token: 'jwt_mock_google_token_' + user.id,
    user
  });
});

// Current User Profile
app.get('/api/auth/me', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const db = readData();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

/* ==========================================================
   TASK ROUTES (Preserving C program logic: ID, Subject, Topic, Duration, Priority, Completed)
   ========================================================== */

// 1. Get all tasks strictly for current user
app.get('/api/tasks', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.json([]);
  }

  const { subject, completed, priority } = req.query;
  const db = readData();

  let userTasks = db.tasks.filter(t => t.userId === userId);

  if (subject && subject !== 'All') {
    userTasks = userTasks.filter(t => t.subject.toLowerCase() === subject.toLowerCase());
  }

  if (completed !== undefined) {
    const isComp = completed === 'true' || completed === '1';
    userTasks = userTasks.filter(t => Boolean(t.completed) === isComp);
  }

  if (priority) {
    userTasks = userTasks.filter(t => t.priority === parseInt(priority));
  }

  res.json(userTasks);
});

// 2. Add task (matching C addTask logic)
app.post('/api/tasks', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { subject, topic, duriation, priority } = req.body;

  if (!subject || !topic) {
    return res.status(400).json({ error: 'Subject and Topic are required' });
  }

  const db = readData();
  const nextId = db.tasks.length > 0 ? Math.max(...db.tasks.map(t => t.id)) + 1 : 1;

  const newTask = {
    id: nextId,
    subject: subject.trim(),
    topic: topic.trim(),
    duriation: parseInt(duriation) || 30, // in minutes
    priority: parseInt(priority) || 2, // 1 = Low, 2 = Medium, 3 = High
    completed: 0,
    userId: userId,
    createdAt: new Date().toISOString()
  };

  db.tasks.push(newTask);
  writeData(db);

  res.status(201).json({
    message: 'Task added successfully!',
    task: newTask
  });
});

// 3. Mark as completed (matching completeTask in C)
app.patch('/api/tasks/:id/complete', (req, res) => {
  const taskId = parseInt(req.params.id);
  const userId = getUserId(req);
  const db = readData();
  const task = db.tasks.find(t => t.id === taskId && (!userId || t.userId === userId));

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Toggle status or explicitly set
  task.completed = req.body.completed !== undefined ? (req.body.completed ? 1 : 0) : (task.completed ? 0 : 1);
  task.completedAt = task.completed ? new Date().toISOString() : null;

  writeData(db);

  res.json({
    message: task.completed ? 'Task marked as completed!' : 'Task marked as pending',
    task
  });
});

// 4. Update task
app.put('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const userId = getUserId(req);
  const { subject, topic, duriation, priority, completed } = req.body;
  const db = readData();

  const taskIndex = db.tasks.findIndex(t => t.id === taskId && (!userId || t.userId === userId));
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (subject) db.tasks[taskIndex].subject = subject.trim();
  if (topic) db.tasks[taskIndex].topic = topic.trim();
  if (duriation !== undefined) db.tasks[taskIndex].duriation = parseInt(duriation);
  if (priority !== undefined) db.tasks[taskIndex].priority = parseInt(priority);
  if (completed !== undefined) db.tasks[taskIndex].completed = completed ? 1 : 0;

  writeData(db);

  res.json({
    message: 'Task updated successfully',
    task: db.tasks[taskIndex]
  });
});

// 5. Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const userId = getUserId(req);
  const db = readData();

  const initialCount = db.tasks.length;
  db.tasks = db.tasks.filter(t => !(t.id === taskId && (!userId || t.userId === userId)));

  if (db.tasks.length === initialCount) {
    return res.status(404).json({ error: 'Task not found' });
  }

  writeData(db);

  res.json({
    message: 'Task deleted successfully!'
  });
});

/* ==========================================================
   FOCUS SESSIONS & TIME STUDIED ANALYTICS
   ========================================================== */

// Log a completed study session
app.post('/api/sessions', (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { taskId, subject, topic, durationMinutes, focusScore, notes } = req.body;

  if (!subject || !durationMinutes) {
    return res.status(400).json({ error: 'Subject and study duration are required' });
  }

  const db = readData();
  const session = {
    id: 'sess_' + Date.now(),
    taskId: taskId || null,
    subject: subject.trim(),
    topic: topic ? topic.trim() : 'General Study',
    durationMinutes: Math.round(Number(durationMinutes)),
    focusScore: focusScore || 95,
    notes: notes || '',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    userId: userId
  };

  db.sessions.push(session);

  // If taskId was linked, optionally mark completed
  if (taskId && req.body.markTaskCompleted) {
    const task = db.tasks.find(t => t.id === parseInt(taskId) && t.userId === userId);
    if (task) {
      task.completed = 1;
      task.completedAt = new Date().toISOString();
    }
  }

  writeData(db);

  res.status(201).json({
    message: 'Focus session recorded successfully!',
    session
  });
});

// Get study sessions strictly for current user
app.get('/api/sessions', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.json([]);

  const db = readData();
  const userSessions = db.sessions
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json(userSessions);
});

// Dashboard Overview & Time Studied Statistics
app.get('/api/stats', (req, res) => {
  const userId = getUserId(req);
  const db = readData();

  const userTasks = userId ? db.tasks.filter(t => t.userId === userId) : [];
  const userSessions = userId ? db.sessions.filter(s => s.userId === userId) : [];
  const userDocuments = userId ? db.documents.filter(d => d.userId === userId) : [];

  // Total study time in minutes
  const totalMinutes = userSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  // Today's study time
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMinutes = userSessions
    .filter(s => s.date === todayStr || (s.timestamp && s.timestamp.startsWith(todayStr)))
    .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  // Tasks statistics
  const completedTasks = userTasks.filter(t => t.completed === 1).length;
  const pendingTasks = userTasks.filter(t => t.completed === 0).length;

  // Study time by subject
  const subjectTimeMap = {};
  userSessions.forEach(s => {
    const subj = s.subject || 'Other';
    subjectTimeMap[subj] = (subjectTimeMap[subj] || 0) + (s.durationMinutes || 0);
  });

  // Calculate day streak (0 if user has never logged a session)
  const uniqueDates = Array.from(new Set(userSessions.map(s => s.date || s.timestamp.split('T')[0]))).sort().reverse();
  let streak = 0;
  if (uniqueDates.length > 0) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if user studied today or yesterday
    let checkDate = new Date(today);
    let checkStr = checkDate.toISOString().split('T')[0];
    
    if (!uniqueDates.includes(checkStr)) {
      // Check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split('T')[0];
    }

    while (uniqueDates.includes(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = checkDate.toISOString().split('T')[0];
    }
  }

  // Last 7 days trend
  const weeklyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    const minutes = userSessions
      .filter(s => s.date === dateStr || (s.timestamp && s.timestamp.startsWith(dateStr)))
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    weeklyTrends.push({
      date: dateStr,
      day: dayName,
      minutes: minutes
    });
  }

  // Get subjects list specifically for THIS user
  const subjectsSet = new Set();
  userTasks.forEach(t => t.subject && subjectsSet.add(t.subject));
  userSessions.forEach(s => s.subject && subjectsSet.add(s.subject));
  userDocuments.forEach(d => d.subject && subjectsSet.add(d.subject));
  const subjects = Array.from(subjectsSet);

  res.json({
    totalMinutes,
    totalHours: (totalMinutes / 60).toFixed(1),
    todayMinutes,
    completedTasks,
    pendingTasks,
    totalTasks: userTasks.length,
    streak: streak,
    subjectTimeMap,
    weeklyTrends,
    subjects,
    recentSessions: userSessions.slice(0, 5)
  });
});

/* ==========================================================
   SUBJECT DOCUMENTS VAULT (Upload, View, Download, Delete)
   ========================================================== */

// Get documents strictly for current user
app.get('/api/documents', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.json([]);

  const { subject } = req.query;
  const db = readData();

  let docs = db.documents.filter(d => d.userId === userId);

  if (subject && subject !== 'All') {
    docs = docs.filter(d => d.subject.toLowerCase() === subject.toLowerCase());
  }

  res.json(docs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
});

// Upload a document for a particular subject
app.post('/api/documents/upload', upload.single('document'), (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { subject, topic, notes } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!subject) {
    return res.status(400).json({ error: 'Subject is required for document categorization' });
  }

  const db = readData();

  // Read preview if small text file
  let previewContent = null;
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (['.txt', '.md', '.json', '.c', '.cpp', '.py', '.js'].includes(ext) && req.file.size < 100000) {
    try {
      previewContent = fs.readFileSync(req.file.path, 'utf-8').slice(0, 5000);
    } catch (e) {
      console.warn('Could not read text preview', e);
    }
  }

  const newDoc = {
    id: 'doc_' + Date.now(),
    subject: subject.trim(),
    topic: topic ? topic.trim() : path.parse(req.file.originalname).name,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    fileType: req.file.mimetype,
    size: req.file.size,
    previewContent: previewContent,
    fileUrl: `/uploads/${req.file.filename}`,
    notes: notes || '',
    uploadedAt: new Date().toISOString(),
    userId: userId
  };

  db.documents.push(newDoc);
  writeData(db);

  res.status(201).json({
    message: 'Document uploaded successfully to subject ' + subject,
    document: newDoc
  });
});

// Download document
app.get('/api/documents/:id/download', (req, res) => {
  const docId = req.params.id;
  const userId = getUserId(req);
  const db = readData();
  const doc = db.documents.find(d => d.id === docId && (!userId || d.userId === userId));

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const filePath = path.join(UPLOADS_DIR, doc.fileName);
  if (!fs.existsSync(filePath)) {
    if (doc.previewContent) {
      res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
      res.setHeader('Content-Type', 'text/plain');
      return res.send(doc.previewContent);
    }
    return res.status(404).json({ error: 'File content missing from storage' });
  }

  res.download(filePath, doc.originalName);
});

// Delete document
app.delete('/api/documents/:id', (req, res) => {
  const docId = req.params.id;
  const userId = getUserId(req);
  const db = readData();
  const docIndex = db.documents.findIndex(d => d.id === docId && (!userId || d.userId === userId));

  if (docIndex === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const doc = db.documents[docIndex];
  const filePath = path.join(UPLOADS_DIR, doc.fileName);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Failed to delete file from disk', e);
    }
  }

  db.documents.splice(docIndex, 1);
  writeData(db);

  res.json({ message: 'Document deleted successfully' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'StudyPlanner Backend API' });
});

// Serve frontend build from client/dist if present
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 StudyPlanner backend running on http://localhost:${PORT}`);
});
