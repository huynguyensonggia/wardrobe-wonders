import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    const res = await authApi.login(email, password);

    const { access_token, user } = res;

    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    setState({
      user,
      token: access_token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);


  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await authApi.register({ email, password, name });

    const { access_token, user } = res;

    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    setState({
      user,
      token: access_token,
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
