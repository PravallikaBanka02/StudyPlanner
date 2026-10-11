import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  CircleDashed, 
  Flame, 
  Play, 
  ArrowUpRight, 
  BookOpen, 
  Sparkles, 
  FolderDown, 
  TrendingUp, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function Dashboard({ stats, tasks, onStartFocus, setActiveTab, onToggleTask }) {
  const pendingTasks = tasks.filter(t => t.completed === 0);
  const topPriorityTask = pendingTasks.sort((a, b) => b.priority - a.priority)[0];

  const getPriorityBadge = (priority) => {
    if (priority === 1) return { label: 'Low', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (priority === 2) return { label: 'Medium', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    return { label: 'High Priority', bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
  };

  const maxWeeklyMinutes = Math.max(...(stats?.weeklyTrends?.map(d => d.minutes) || [60]), 60);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-900/40 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily Focus Dashboard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to learn and <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">excel today?</span>
            </h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              You have <span className="text-white font-semibold">{pendingTasks.length} pending study tasks</span> waiting. Jump straight into Focus Mode or upload subject notes to stay organized.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (topPriorityTask) onStartFocus(topPriorityTask);
                else setActiveTab('focus');
              }}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Focus Mode</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 text-sm font-semibold transition"
            >
              <FolderDown className="w-4 h-4 text-indigo-400" />
              <span>Subject Vault</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Essential Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Time Studied */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Studied</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.totalHours || '0.0'}</span>
            <span className="text-xs text-slate-400 font-medium">hours</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>{stats?.totalMinutes || 0} minutes cumulative focus</span>
          </p>
        </div>

        {/* Today's Study Time */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Focus</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.todayMinutes || 0}</span>
            <span className="text-xs text-slate-400 font-medium">mins</span>
          </div>
          <p className="text-[11px] text-purple-300/80 mt-2">
            {stats?.todayMinutes > 45 ? '🎯 Daily target surpassed!' : 'Keep going towards 60m daily goal'}
          </p>
        </div>

        {/* Completed vs Pending Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tasks Completed</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{stats?.completedTasks || 0}</span>
            <span className="text-xs text-slate-400 font-medium">/ {stats?.totalTasks || 0} tasks</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats?.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        {/* Study Streak */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Streak</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-5 h-5 fill-amber-500/30" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{stats?.streak || 1}</span>
            <span className="text-xs text-slate-400 font-medium">days active</span>
          </div>
          <p className="text-[11px] text-amber-300/80 mt-2">
            Consistency is the secret of mastery
          </p>
        </div>

      </div>

      {/* Middle Row: 7-Day Activity Chart & Subject Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day Activity Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                7-Day Study Activity (Minutes)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily focus time logged across sessions</p>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800/60">
            {stats?.weeklyTrends?.map((day, idx) => {
              const heightPct = Math.min(100, Math.round((day.minutes / maxWeeklyMinutes) * 100));
              const isToday = idx === stats.weeklyTrends.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.minutes}m
                  </div>
                  <div className="w-full max-w-[40px] bg-slate-800/80 rounded-t-lg h-36 flex items-end p-1">
                    <div
                      className={`w-full rounded-md transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-purple-500 shadow-lg shadow-indigo-500/30'
                          : day.minutes > 0
                          ? 'bg-gradient-to-t from-indigo-700/80 to-indigo-500/80'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isToday ? 'text-indigo-300 font-bold' : 'text-slate-400'}`}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Weekly Goal: 300 minutes</span>
            <span className="font-semibold text-slate-200">
              {stats?.weeklyTrends?.reduce((sum, d) => sum + d.minutes, 0) || 0} mins logged this week
            </span>
          </div>
        </div>

        {/* Subject Time Breakdown */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Time by Subject
            </h3>
            <p className="text-xs text-slate-400 mb-5">Distribution of focused study</p>

            <div className="space-y-4">
              {stats?.subjectTimeMap && Object.keys(stats.subjectTimeMap).length > 0 ? (
                Object.entries(stats.subjectTimeMap).map(([subject, minutes]) => {
                  const pct = stats.totalMinutes > 0 ? Math.round((minutes / stats.totalMinutes) * 100) : 0;
                  return (
                    <div key={subject} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-200">{subject}</span>
                        <span className="text-slate-400 font-mono">{minutes}m ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No sessions recorded yet. Start a study session to see breakdown!
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('documents')}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-indigo-300 hover:text-white transition flex items-center justify-center gap-2"
          >
            <FolderDown className="w-4 h-4" />
            <span>Manage Subject Documents</span>
          </button>
        </div>

      </div>

      {/* Bottom Section: Up Next Task & Quick Task Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Next Priority Focus Task */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 bg-gradient-to-br from-indigo-950/30 to-slate-900">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-400">
              Next Priority Focus
            </span>
            {topPriorityTask && (
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getPriorityBadge(topPriorityTask.priority).bg}`}>
                {getPriorityBadge(topPriorityTask.priority).label}
              </span>
            )}
          </div>

          {topPriorityTask ? (
            <div>
              <span className="text-xs font-semibold text-indigo-300/80 uppercase tracking-wide">
                {topPriorityTask.subject}
              </span>
              <h4 className="text-lg font-bold text-white mt-1 mb-3">
                {topPriorityTask.topic}
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-300 mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {topPriorityTask.duriation} mins target
                </span>
                <span className="text-slate-600">•</span>
                <span>Task #{topPriorityTask.id}</span>
              </div>

              <button
                onClick={() => onStartFocus(topPriorityTask)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch Timer for this Task</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-white">All tasks completed!</p>
              <p className="text-xs text-slate-400 mt-1">Add more tasks in the tasks tab to stay ahead.</p>
              <button
                onClick={() => setActiveTab('tasks')}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition"
              >
                + Add Study Task
              </button>
            </div>
          )}
        </div>

        {/* Priority Task Checklist */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Active Study Tasks</h3>
              <p className="text-xs text-slate-400">Click circle to mark completed</p>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              View all ({tasks.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.slice(0, 4).map((task) => {
              const badge = getPriorityBadge(task.priority);
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    task.completed
                      ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(task.id, !task.completed)}
                      className={`p-1 rounded-lg transition ${
                        task.completed ? 'text-emerald-400 hover:text-slate-400' : 'text-slate-500 hover:text-emerald-400'
                      }`}
                    >
                      {task.completed ? <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" /> : <CircleDashed className="w-5 h-5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-300">{task.subject}</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.topic}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {task.duriation} min
                    </span>
                    {!task.completed && (
                      <button
                        onClick={() => onStartFocus(task)}
                        title="Start Focus"
                        className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No tasks available. Add your first task from the Study Tasks tab!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
