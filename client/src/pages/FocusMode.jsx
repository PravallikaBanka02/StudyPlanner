import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  CheckCircle, 
  BookOpen, 
  Flame, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { audioService } from '../services/audioService';

export default function FocusMode({ activeTask, tasks, onLogSession, onCompleteTask }) {
  const [selectedTask, setSelectedTask] = useState(activeTask || null);
  const [customSubject, setCustomSubject] = useState(activeTask?.subject || 'General Study');
  const [customTopic, setCustomTopic] = useState(activeTask?.topic || 'Deep Learning Session');
  
  // Timer state
  const initialMinutes = activeTask?.duriation || 25;
  const [timerDuration, setTimerDuration] = useState(initialMinutes * 60); // in seconds
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sound State
  const [selectedSound, setSelectedSound] = useState('rain'); // 'none', 'rain', 'binaural', 'whitenoise'
  const [soundVolume, setSoundVolume] = useState(50);

  // Completion modal state
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  const containerRef = useRef(null);

  // Sync when activeTask prop changes
  useEffect(() => {
    if (activeTask) {
      setSelectedTask(activeTask);
      setCustomSubject(activeTask.subject);
      setCustomTopic(activeTask.topic);
      const secs = (activeTask.duriation || 25) * 60;
      setTimerDuration(secs);
      setTimeLeft(secs);
      setIsRunning(false);
    }
  }, [activeTask]);

  // Timer interval effect
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Handle Ambiance audio
  useEffect(() => {
    if (isRunning) {
      if (selectedSound === 'rain') audioService.playRain();
      else if (selectedSound === 'binaural') audioService.playBinauralAlpha();
      else if (selectedSound === 'whitenoise') audioService.playWhiteNoise();
      else audioService.stop();
    } else {
      audioService.stop();
    }

    return () => {
      audioService.stop();
    };
  }, [isRunning, selectedSound]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    audioService.stop();
    audioService.playCompletionChime();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    setShowFinishedModal(true);
  };

  const saveCompletedSession = async (markTaskDone = true) => {
    const elapsedMinutes = Math.max(1, Math.round((timerDuration - timeLeft) / 60 || timerDuration / 60));

    await onLogSession({
      taskId: selectedTask?.id || null,
      subject: customSubject,
      topic: customTopic,
      durationMinutes: elapsedMinutes,
      focusScore: 96,
      notes: sessionNotes,
      markTaskCompleted: markTaskDone && selectedTask ? true : false
    });

    if (markTaskDone && selectedTask) {
      onCompleteTask(selectedTask.id, 1);
    }

    setShowFinishedModal(false);
    // Reset timer
    setTimeLeft(timerDuration);
  };

  const handlePresetSelect = (minutes) => {
    setIsRunning(false);
    setTimerDuration(minutes * 60);
    setTimeLeft(minutes * 60);
  };

  const handleTaskChange = (taskIdStr) => {
    if (!taskIdStr) {
      setSelectedTask(null);
      setCustomSubject('General Study');
      setCustomTopic('Deep Learning Session');
      handlePresetSelect(25);
      return;
    }
    const t = tasks.find(item => item.id === parseInt(taskIdStr));
    if (t) {
      setSelectedTask(t);
      setCustomSubject(t.subject);
      setCustomTopic(t.topic);
      handlePresetSelect(t.duriation || 25);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((timerDuration - timeLeft) / timerDuration) * 100;

  return (
    <div 
      ref={containerRef}
      className={`relative min-h-[680px] rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-between border transition-all ${
        isFullscreen ? 'bg-slate-950 p-12 fixed inset-0 z-50 rounded-none border-none' : 'glass-panel border-slate-800/80 bg-slate-950/60'
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Active Task Selector & Zen toggle */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Task:</span>
          <select
            value={selectedTask?.id || ''}
            onChange={(e) => handleTaskChange(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-indigo-300 focus:outline-none focus:border-indigo-500 max-w-[280px] truncate"
          >
            <option value="">-- General Study Session --</option>
            {tasks.filter(t => !t.completed).map(t => (
              <option key={t.id} value={t.id}>
                [{t.subject}] {t.topic} ({t.duriation}m)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Duration Buttons */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => handlePresetSelect(mins)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  timerDuration === mins * 60
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Zen Mode' : 'Enter Zen Fullscreen'}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center: Glowing Circular Timer Ring */}
      <div className="relative flex flex-col items-center justify-center my-8 z-10">
        
        {/* SVG Circular Ring */}
        <div className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-800/80"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-indigo-500 transition-all duration-1000 ease-linear"
              strokeWidth="5"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 mb-1">
              {isRunning ? 'DEEP FOCUS ACTIVE' : 'FOCUS MODE READY'}
            </span>
            <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tighter text-white drop-shadow-md">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-300 max-w-[200px] truncate">
              {customSubject}
            </div>
            <div className="text-[11px] text-slate-400 max-w-[200px] truncate">
              {customTopic}
            </div>
          </div>
        </div>

        {/* Play/Pause & Reset Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={() => {
              if (timeLeft === 0) setTimeLeft(timerDuration);
              setIsRunning(!isRunning);
            }}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm text-white shadow-xl transition-all transform active:scale-95 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>{timeLeft < timerDuration ? 'Resume Focus' : 'Start Focus Session'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(timerDuration);
            }}
            title="Reset Timer"
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Bottom Ambiance Audio Selector */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            Ambiance Sound:
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'none', label: 'Mute' },
              { id: 'rain', label: 'Rainfall 🌧️' },
              { id: 'binaural', label: 'Alpha Waves (10Hz) 🧠' },
              { id: 'whitenoise', label: 'White Noise 📻' }
            ].map(snd => (
              <button
                key={snd.id}
                onClick={() => setSelectedSound(snd.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  selectedSound === snd.id
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            value={soundVolume}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSoundVolume(val);
              audioService.setVolume(val / 100);
            }}
            className="w-24 accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Session Completed Modal */}
      {showFinishedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-1">Phenomenal Focus!</h3>
            <p className="text-xs text-slate-400 mb-6">
              You just crushed a {Math.round(timerDuration / 60)}-minute study sprint for{' '}
              <span className="text-indigo-400 font-bold">{customSubject}</span>.
            </p>

            <div className="text-left mb-6">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Session Reflection / Notes (Optional)
              </label>
              <textarea
                rows="2"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you learn or accomplish during this sprint?"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              {selectedTask && (
                <button
                  onClick={() => saveCompletedSession(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Task #{selectedTask.id} Completed & Save Time</span>
                </button>
              )}

              <button
                onClick={() => saveCompletedSession(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition"
              >
                Log Study Time Only (Keep Task Pending)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
