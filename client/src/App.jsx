import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';
import TasksView from './pages/TasksView';
import FocusMode from './pages/FocusMode';
import TimeStudied from './pages/TimeStudied';
import DocumentsVault from './pages/DocumentsVault';
import { api } from './services/api';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeFocusTask, setActiveFocusTask] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load Tasks and Stats whenever user changes or refreshed
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, refreshTrigger]);

  const loadData = async () => {
    try {
      const [fetchedTasks, fetchedStats] = await Promise.all([
        api.getTasks(),
        api.getStats()
      ]);
      setTasks(fetchedTasks);
      setStats(fetchedStats);
      if (fetchedStats?.subjects) {
        setSubjects(fetchedStats.subjects);
      }
    } catch (err) {
      console.error('Error loading study data:', err);
    }
  };

  const handleAddTask = async (taskData) => {
    const res = await api.createTask(taskData);
    setTasks(prev => [...prev, res.task]);
    setRefreshTrigger(n => n + 1);
  };

  const handleToggleTask = async (taskId, newCompleted) => {
    const res = await api.toggleCompleteTask(taskId, newCompleted);
    setTasks(prev => prev.map(t => t.id === taskId ? res.task : t));
    setRefreshTrigger(n => n + 1);
  };

  const handleDeleteTask = async (taskId) => {
    await api.deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setRefreshTrigger(n => n + 1);
  };

  const handleStartFocus = (task) => {
    setActiveFocusTask(task);
    setActiveTab('focus');
  };

  const handleLogSession = async (sessionData) => {
    await api.logSession(sessionData);
    setRefreshTrigger(n => n + 1);
  };

  // If user is not signed in, show AuthModal
  if (!user && !loading) {
    return <AuthModal onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Background radial gradients for attractive aesthetics */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[350px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 z-10">
        {activeTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            tasks={tasks}
            onStartFocus={handleStartFocus}
            setActiveTab={setActiveTab}
            onToggleTask={handleToggleTask}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onStartFocus={handleStartFocus}
            subjects={subjects}
          />
        )}

        {activeTab === 'focus' && (
          <FocusMode
            activeTask={activeFocusTask}
            tasks={tasks}
            onLogSession={handleLogSession}
            onCompleteTask={handleToggleTask}
          />
        )}

        {activeTab === 'analytics' && (
          <TimeStudied
            stats={stats}
            onLogSession={handleLogSession}
            subjects={subjects}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsVault
            subjects={subjects}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 StudyPlanner Suite • Built with React, Tailwind CSS, Express & Node.js</p>
          <p className="text-slate-400">
            Tasks Engine based on C StudyPlanner Core
          </p>
        </div>
      </footer>

    </div>
  );
}
