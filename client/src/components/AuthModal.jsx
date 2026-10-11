import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, BookOpen, Clock, FileText, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ onLoginSuccess }) {
  const { loginWithEmail, loginWithGoogle, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Handle Google Login Flow
  const handleGoogleLogin = async (customEmail = null, customName = null, isTesting = false) => {
    setError('');
    const targetEmail = customEmail || prompt('Enter your Google email (or leave default for quick sign-in):', 'student@gmail.com') || 'student@gmail.com';
    const targetName = customName || targetEmail.split('@')[0];

    try {
      await loginWithGoogle({
        email: targetEmail,
        name: targetName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetName)}`,
        googleId: 'g_' + Math.floor(Math.random() * 1000000),
        isTesting: isTesting
      });
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    }
  };

  // Handle Email Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      await loginWithEmail(email, password, name || email.split('@')[0]);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-900/90 backdrop-blur-2xl z-10">
        
        {/* Left Side: Brand & Feature Highlights */}
        <div className="p-8 md:p-10 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/60">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">StudyPlanner</h1>
                <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Deep Work & Productivity Suite</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-3">
              Master your study goals with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">clarity and focus.</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Seamlessly organize subject tasks, track every minute of study time, dive into distraction-free Pomodoro focus sessions, and attach learning documents.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Focus Mode & Binaural Sounds</h4>
                  <p className="text-xs text-slate-400">Pomodoro focus timers with ambient rainfall and alpha brainwave sounds.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Time Studied & Streak Analytics</h4>
                  <p className="text-xs text-slate-400">Track study hours by subject, daily consistency streaks, and milestone charts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Subject Document Vault</h4>
                  <p className="text-xs text-slate-400">Upload notes, PDFs, code snippets, and cheatsheets per subject.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Migrated & enhanced from your C StudyPlanner core</span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-1">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h3>
            <p className="text-sm text-slate-400">
              Sign in with your Google account or email to enter your Study Dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 transition-all duration-200 shadow-sm hover:shadow-indigo-500/10 mb-5 group active:scale-[0.99]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">or email</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          {/* Email Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mohit Banka"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Pills */}
          <div className="mt-6 pt-5 border-t border-slate-800/60">
            <p className="text-xs text-slate-400 mb-2 font-medium">Quick 1-Click Test Accounts (With Sample Data):</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGoogleLogin('demo@studyplanner.com', 'Demo Tester', true)}
                className="text-xs py-2 px-3 rounded-lg bg-slate-800/70 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white transition flex items-center justify-between"
              >
                <span>Demo Tester</span>
                <span className="text-[10px] text-indigo-400 font-mono">Sample</span>
              </button>
              <button
                type="button"
                onClick={() => handleGoogleLogin('sarah.cs@stanford.edu', 'Sarah Chen', true)}
                className="text-xs py-2 px-3 rounded-lg bg-slate-800/70 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white transition flex items-center justify-between"
              >
                <span>Sarah Chen</span>
                <span className="text-[10px] text-purple-400 font-mono">Sample</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs text-slate-400 hover:text-indigo-400 transition"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
