import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('studyplanner_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('studyplanner_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('studyplanner_user');
    }
  }, [user]);

  const loginWithEmail = async (email, password, name) => {
    setLoading(true);
    try {
      const res = await api.loginEmail(email, password, name);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleProfile) => {
    setLoading(true);
    try {
      const res = await api.loginGoogle(googleProfile);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('studyplanner_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
