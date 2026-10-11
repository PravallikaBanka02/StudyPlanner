import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  CircleDashed, 
  Play, 
  Clock, 
  Layers, 
  X,
  AlertTriangle
} from 'lucide-react';

export default function TasksView({ tasks, onAddTask, onToggleTask, onDeleteTask, onStartFocus, subjects }) {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New task form state
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newDuration, setNewDuration] = useState(45);
  const [newPriority, setNewPriority] = useState(2); // 1 = Low, 2 = Medium, 3 = High
  const [formError, setFormError] = useState('');

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newSubject.trim() || !newTopic.trim()) {
      setFormError('Please enter both subject name and topic.');
      return;
    }

    try {
      await onAddTask({
        subject: newSubject.trim(),
        topic: newTopic.trim(),
        duriation: parseInt(newDuration) || 30,
        priority: parseInt(newPriority) || 2
      });
      setIsAddModalOpen(false);
      setNewSubject('');
      setNewTopic('');
      setNewDuration(45);
      setNewPriority(2);
    } catch (err) {
      setFormError(err.message || 'Failed to create task');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = 
      t.subject.toLowerCase().includes(search.toLowerCase()) || 
      t.topic.toLowerCase().includes(search.toLowerCase());
    
    const matchesSubject = selectedSubject === 'All' || t.subject.toLowerCase() === selectedSubject.toLowerCase();
    
    const matchesPriority = selectedPriority === 'All' || t.priority === parseInt(selectedPriority);

    const matchesStatus = 
      selectedStatus === 'All' || 
      (selectedStatus === 'Completed' && t.completed === 1) || 
      (selectedStatus === 'Pending' && t.completed === 0);

    return matchesSearch && matchesSubject && matchesPriority && matchesStatus;
  });

  const getPriorityBadge = (priority) => {
    if (priority === 1) return { label: 'Low', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (priority === 2) return { label: 'Medium', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    return { label: 'High', bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
  };

  const allSubjects = Array.from(new Set(['Operating Systems', 'Data Structures', 'Computer Networks', 'Mathematics', ...subjects]));

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Study Tasks Manager</h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize topics, estimated durations, and priority levels for maximum study throughput.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search topic or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Subject Filter */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Subjects</option>
          {allSubjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Priorities</option>
          <option value="3">High Priority</option>
          <option value="2">Medium Priority</option>
          <option value="1">Low Priority</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>

      </div>

      {/* Task List Table / Cards */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800/80">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Showing {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
          </span>
          <span className="text-xs text-slate-500">
            {tasks.filter(t => t.completed).length} completed • {tasks.filter(t => !t.completed).length} pending
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const priorityInfo = getPriorityBadge(task.priority);
              return (
                <div
                  key={task.id}
                  className={`p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    task.completed ? 'bg-slate-950/40 opacity-70' : 'bg-slate-900/40 hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => onToggleTask(task.id, !task.completed)}
                      title={task.completed ? "Mark pending" : "Mark completed"}
                      className={`mt-1 p-1 rounded-xl transition ${
                        task.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                      ) : (
                        <CircleDashed className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          #{task.id}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {task.subject}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${priorityInfo.bg}`}>
                          {priorityInfo.label} Priority
                        </span>
                      </div>

                      <h3 className={`text-base font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.topic}
                      </h3>

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          {task.duriation} mins
                        </span>
                        <span>•</span>
                        <span className={task.completed ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                          {task.completed ? 'Completed' : 'Pending Study'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!task.completed && (
                      <button
                        onClick={() => onStartFocus(task)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Focus</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      title="Delete Task"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No study tasks match your filters</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting search filters or add a new study task.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Add New Study Task</h3>
            <p className="text-xs text-slate-400 mb-6">
              Configure your study task subject, topic, duration, and priority.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems, Mathematics, Algorithms"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memory Management & Paging, Binary Trees"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1">1 - Low Priority</option>
                    <option value="2">2 - Medium Priority</option>
                    <option value="3">3 - High Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
