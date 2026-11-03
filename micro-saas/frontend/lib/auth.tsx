"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  archetype: 'Allowance' | 'Jobber' | 'Traveler' | 'Saver';
  telegram_id?: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  archetype: 'Allowance' | 'Jobber' | 'Traveler' | 'Saver';
  telegram_id?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is logged in on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
          // Verify token is still valid
          await api.auth.me();
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.auth.login({ username, password });
      
      const { access_token, user: userData } = response.data;
      
      // Store token and user data
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      await api.auth.register(userData);
      
      // Auto-login after registration
      await login(userData.username, userData.password);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.auth.me();
      const userData = response.data;
      
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}