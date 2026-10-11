const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'study_planner_db.json');

// List of recognized test/demo accounts
const TESTING_EMAILS = [
  'student@studyplanner.com',
  'demo@studyplanner.com',
  'test@studyplanner.com',
  'sarah.cs@stanford.edu'
];

function isTestingAccount(email) {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  return TESTING_EMAILS.includes(cleanEmail) || cleanEmail.startsWith('demo') || cleanEmail.startsWith('test_');
}

// Generate sample seed data strictly for testing accounts
function getSeedDataForTestUser(userId) {
  const tasks = [
    {
      id: 1,
      subject: "Operating Systems",
      topic: "Process Scheduling Algorithms (Round Robin & SJF)",
      duriation: 45,
      priority: 3, // 1 = Low, 2 = Medium, 3 = High
      completed: 1,
      userId: userId,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 2,
      subject: "Data Structures",
      topic: "Binary Search Trees & AVL Balancing",
      duriation: 60,
      priority: 3,
      completed: 0,
      userId: userId,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      subject: "Computer Networks",
      topic: "TCP/IP 3-Way Handshake & Flow Control",
      duriation: 30,
      priority: 2,
      completed: 0,
      userId: userId,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      subject: "Mathematics",
      topic: "Eigenvalues & Diagonalization",
      duriation: 50,
      priority: 1,
      completed: 0,
      userId: userId,
      createdAt: new Date().toISOString()
    }
  ];

  const sessions = [
    {
      id: "sess_demo_1",
      taskId: 1,
      subject: "Operating Systems",
      topic: "Process Scheduling Algorithms",
      durationMinutes: 45,
      focusScore: 94,
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      userId: userId
    },
    {
      id: "sess_demo_2",
      taskId: 2,
      subject: "Data Structures",
      topic: "Binary Search Trees",
      durationMinutes: 35,
      focusScore: 98,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      userId: userId
    },
    {
      id: "sess_demo_3",
      subject: "Mathematics",
      topic: "Linear Algebra matrices review",
      durationMinutes: 25,
      focusScore: 90,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      userId: userId
    }
  ];

  const documents = [
    {
      id: "doc_demo_1",
      subject: "Operating Systems",
      topic: "Process Scheduling Cheat Sheet",
      fileName: "os_scheduling_summary.txt",
      originalName: "os_scheduling_summary.txt",
      fileType: "text/plain",
      size: 4096,
      previewContent: "CPU Scheduling Notes:\n- First-Come First-Served (FCFS): Non-preemptive, suffers from convoy effect.\n- Shortest Job First (SJF): Optimal average waiting time.\n- Round Robin (RR): Preemptive with time quantum Q.\n- Priority Scheduling: Preemptive or non-preemptive, starvation resolved by aging.",
      uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      userId: userId
    },
    {
      id: "doc_demo_2",
      subject: "Data Structures",
      topic: "BST and Tree Traversal Formulas",
      fileName: "bst_cheatsheet.txt",
      originalName: "bst_cheatsheet.txt",
      fileType: "text/plain",
      size: 3200,
      previewContent: "Binary Search Tree Properties:\n1. Left subtree of a node contains only keys lesser than the node's key.\n2. Right subtree contains keys greater.\n3. In-order traversal of a BST yields sorted values.\n4. Balanced height: O(log N) for search, insert, and delete.",
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      userId: userId
    }
  ];

  return { tasks, sessions, documents };
}

// Default initial state with ONLY the demo testing student
const defaultData = {
  users: [
    {
      id: "usr_demo",
      email: "demo@studyplanner.com",
      name: "Demo Tester",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DemoTester",
      provider: "email",
      isTestingAccount: true,
      createdAt: new Date().toISOString()
    }
  ],
  tasks: getSeedDataForTestUser("usr_demo").tasks,
  sessions: getSeedDataForTestUser("usr_demo").sessions,
  documents: getSeedDataForTestUser("usr_demo").documents
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readData() {
  const dir = path.dirname(DATA_FILE);
  ensureDir(dir);
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning defaults', err);
    return defaultData;
  }
}

function writeData(data) {
  const dir = path.dirname(DATA_FILE);
  ensureDir(dir);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  readData,
  writeData,
  ensureDir,
  isTestingAccount,
  getSeedDataForTestUser
};
