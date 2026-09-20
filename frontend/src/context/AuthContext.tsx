import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { initialUserProfile } from '../data/initialData';

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isDemoUser: boolean;
  login: (email: string, password: string) => boolean;
  loginDemo: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('dischargeguard_auth');
    return saved === 'true';
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('dischargeguard_user');
    return savedUser ? JSON.parse(savedUser) : initialUserProfile;
  });

  const [isDemoUser, setIsDemoUser] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem('dischargeguard_auth', isAuthenticated ? 'true' : 'false');
    if (user) {
      localStorage.setItem('dischargeguard_user', JSON.stringify(user));
    }
  }, [isAuthenticated, user]);

  const loginDemo = () => {
    setUser(initialUserProfile);
    setIsAuthenticated(true);
    setIsDemoUser(true);
  };

  const login = (email: string, pass: string): boolean => {
    if (email.trim().toLowerCase() === 'demo@dischargeguard.com' && pass === 'Demo123!') {
      loginDemo();
      return true;
    }
    // For demo app, allow any non-empty input as demo sign-in
    if (email.trim() && pass.trim()) {
      setUser({
        ...initialUserProfile,
        email: email.trim(),
        name: email.split('@')[0].replace('.', ' ')
      });
      setIsAuthenticated(true);
      setIsDemoUser(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dischargeguard_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isDemoUser, login, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
