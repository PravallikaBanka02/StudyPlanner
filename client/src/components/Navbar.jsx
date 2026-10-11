import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  LayoutDashboard, 
  CheckSquare, 
  Flame, 
  Headphones, 
  FolderDown, 
  BarChart3, 
  LogOut, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { audioService } from '../services/audioService';

export default function Navbar({ activeTab, setActiveTab, stats }) {
  const { user, logout } = useAuth();
  const [audioOpen, setAudioOpen] = useState(false);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [volume, setVolume] = useState(50);
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleSound = (track) => {
    if (playingTrack === track) {
      audioService.stop();
      setPlayingTrack(null);
    } else {
      if (track === 'rain') audioService.playRain();
      else if (track === 'binaural') audioService.playBinauralAlpha();
      else if (track === 'whitenoise') audioService.playWhiteNoise();
      setPlayingTrack(track);
    }
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    audioService.setVolume(val / 100);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Study Tasks', icon: CheckSquare, badge: stats?.pendingTasks },
    { id: 'focus', label: 'Focus Mode', icon: Headphones, highlight: true },
    { id: 'analytics', label: 'Time Studied', icon: BarChart3 },
    { id: 'documents', label: 'Documents Vault', icon: FolderDown },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              StudyPlanner
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800/60 shadow-inner overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Ambient Audio Pill, Streak, Profile */}
        <div className="flex items-center gap-3">
          
          {/* Ambient Sound Controller */}
          <div className="relative">
            <button
              onClick={() => setAudioOpen(!audioOpen)}
              title="Study Ambiance Sounds"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                playingTrack
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-sm shadow-indigo-500/20 animate-pulse'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {playingTrack ? `Playing ${playingTrack}` : 'Ambiance'}
              </span>
            </button>

            {/* Audio Dropdown */}
            {audioOpen && (
              <div className="absolute right-0 mt-2 w-64 p-3 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Focus Ambiance
                  </span>
                  {playingTrack && (
                    <button
                      onClick={() => {
                        audioService.stop();
                        setPlayingTrack(null);
                      }}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Stop
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 mb-3">
                  {[
                    { id: 'rain', label: 'Gentle Rainfall' },
                    { id: 'binaural', label: '10Hz Alpha Waves (Deep Focus)' },
                    { id: 'whitenoise', label: 'White Noise Shroud' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => toggleSound(t.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        playingTrack === t.id
                          ? 'bg-indigo-600 text-white font-medium shadow-sm'
                          : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{t.label}</span>
                      {playingTrack === t.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-xs text-slate-400">
                  <Volume2 className="w-3.5 h-3.5" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono">{volume}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Streak Counter */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
            <span>{stats?.streak || 1} Day Streak</span>
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
                alt="Avatar"
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500/40"
              />
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline max-w-[90px] truncate">
                {user?.name || 'Student'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 mr-1" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl z-50">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
