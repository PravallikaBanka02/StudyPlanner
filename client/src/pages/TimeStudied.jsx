import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Flame, 
  Calendar, 
  Award, 
  Plus, 
  BookOpen, 
  TrendingUp, 
  CheckCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function TimeStudied({ stats, onLogSession, subjects }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual Session Form
  const [manualSubject, setManualSubject] = useState('');
  const [manualTopic, setManualTopic] = useState('');
  const [manualMinutes, setManualMinutes] = useState(45);
  const [manualNotes, setManualNotes] = useState('');

  const fetchSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Error fetching sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualSubject.trim()) return;

    await onLogSession({
      subject: manualSubject.trim(),
      topic: manualTopic.trim() || 'Offline Study',
      durationMinutes: parseInt(manualMinutes) || 30,
      notes: manualNotes,
      focusScore: 92
    });

    setIsManualModalOpen(false);
    setManualSubject('');
    setManualTopic('');
    setManualMinutes(45);
    setManualNotes('');
    fetchSessions();
  };

  const allSubjects = Array.from(new Set(['Operating Systems', 'Data Structures', 'Computer Networks', 'Mathematics', ...subjects]));
  const maxWeeklyMinutes = Math.max(...(stats?.weeklyTrends?.map(d => d.minutes) || [60]), 60);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Time Studied & Productivity</h2>
          <p className="text-xs text-slate-400 mt-1">
            Detailed analytics on study duration, subject allocation, and daily consistency.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>Log Offline Study Time</span>
        </button>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Total Study Time</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.totalHours || '0.0'}</span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {stats?.totalMinutes || 0} total minutes logged
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Today's Focus</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.todayMinutes || 0}</span>
            <span className="text-xs text-slate-400">mins today</span>
          </div>
          <span className="text-[11px] text-purple-300/80 mt-2 block">
            Target: 60 mins daily
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Current Streak</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4 fill-amber-500/20" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{stats?.streak || 1}</span>
            <span className="text-xs text-slate-400">consecutive days</span>
          </div>
          <span className="text-[11px] text-amber-300/80 mt-2 block">
            Keep the flame alive tomorrow!
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Sessions Logged</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{sessions.length}</span>
            <span className="text-xs text-slate-400">focus sprints</span>
          </div>
          <span className="text-[11px] text-emerald-300/80 mt-2 block">
            Avg ~{sessions.length > 0 ? Math.round((stats?.totalMinutes || 0) / sessions.length) : 0} mins / session
          </span>
        </div>
      </div>

      {/* 7-Day Chart & Subject Time Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Trend Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                7-Day Study Graph
              </h3>
              <p className="text-xs text-slate-400">Minutes studied each day</p>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-800/60">
            {stats?.weeklyTrends?.map((day, idx) => {
              const heightPct = Math.min(100, Math.round((day.minutes / maxWeeklyMinutes) * 100));
              const isToday = idx === stats.weeklyTrends.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.minutes}m
                  </div>
                  <div className="w-full max-w-[44px] bg-slate-900 rounded-t-xl h-40 flex items-end p-1">
                    <div
                      className={`w-full rounded-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/30'
                          : day.minutes > 0
                          ? 'bg-gradient-to-t from-indigo-700 to-indigo-500'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: `${Math.max(heightPct, 5)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between text-xs text-slate-400">
            <span>Consistency Score: 92%</span>
            <span className="font-semibold text-slate-300">
              Total this week: {stats?.weeklyTrends?.reduce((sum, d) => sum + d.minutes, 0) || 0} mins
            </span>
          </div>
        </div>

        {/* Subject-Wise Time Allocation */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-purple-400" />
            Subject Time Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-6">Total hours and minutes studied per subject</p>

          <div className="space-y-4">
            {stats?.subjectTimeMap && Object.keys(stats.subjectTimeMap).length > 0 ? (
              Object.entries(stats.subjectTimeMap).map(([subj, minutes]) => {
                const pct = stats.totalMinutes > 0 ? Math.round((minutes / stats.totalMinutes) * 100) : 0;
                const hours = (minutes / 60).toFixed(1);
                return (
                  <div key={subj} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-bold text-white">{subj}</span>
                      <span className="text-slate-400 font-mono">
                        {hours} hrs ({minutes}m) • <strong className="text-indigo-400">{pct}%</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No session history yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Full Study Sessions Log Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800/80">
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Study Session History ({sessions.length})
          </h3>
          <span className="text-xs text-slate-500">Chronological focus record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 uppercase font-mono">
              <tr>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Subject</th>
                <th className="py-3 px-5">Topic / Objective</th>
                <th className="py-3 px-5">Duration</th>
                <th className="py-3 px-5">Focus Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-5 font-mono text-slate-400">
                    {sess.date || (sess.timestamp ? sess.timestamp.split('T')[0] : 'Today')}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30">
                      {sess.subject}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-medium text-white max-w-xs truncate">
                    {sess.topic}
                    {sess.notes && (
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sess.notes}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-emerald-400 font-bold">
                    {sess.durationMinutes} mins
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20 text-[10px]">
                      {sess.focusScore || 95}% Focus
                    </span>
                  </td>
                </tr>
              ))}

              {sessions.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">
                    No sessions logged yet. Complete a Pomodoro session or log study time above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Study Log Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Log Offline Study Time</h3>
            <p className="text-xs text-slate-400 mb-6">
              Record reading from textbooks, lecture classes, or offline study sessions.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems, Mathematics"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Textbook Problems"
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="600"
                  required
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Summary of study materials covered..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Log Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
