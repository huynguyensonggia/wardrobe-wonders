import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS = [
  {
    id: '1',
    email: 'user@demo.com',
    password: 'demo123',
    name: 'Sarah Johnson',
    role: 'USER' as const,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'ADMIN' as const,
    createdAt: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (!mockUser) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...user } = mockUser;
    const token = `mock_token_${Date.now()}`;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (MOCK_USERS.some(u => u.email === email)) {
      throw new Error('Email already exists');
    }

    const user: User = {
      id: `${Date.now()}`,
      email,
      name,
      role: 'USER',
      createdAt: new Date().toISOString(),
    };
    
    const token = `mock_token_${Date.now()}`;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...updates };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
