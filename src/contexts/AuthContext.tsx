'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, ApiResponse, LoginData, RefreshData, PublicUser } from '@/lib/api';

interface User extends PublicUser {}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refetchUser: () => Promise<void>;
}

// Helper function to set cookie
const setCookie = (name: string, value: string, days: number = 1) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

// Helper function to delete cookie
const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted auth state from localStorage on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      // Also set cookies for API routes
      setCookie('token', storedAccessToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {}
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response: ApiResponse<LoginData> = await apiClient.login({ email, password });

      if (response.success && response.data) {
        setUser(response.data.user);
        setAccessToken(response.data.tokens.accessToken);

        // Store tokens and user in localStorage
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Also set cookies for API routes
        setCookie('token', response.data.tokens.accessToken);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }) => {
    try {
      const response: ApiResponse<LoginData> = await apiClient.register(userData);

      if (response.success && response.data) {
        setUser(response.data.user);
        setAccessToken(response.data.tokens.accessToken);

        // Store tokens and user in localStorage
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Also set cookies for API routes
        setCookie('token', response.data.tokens.accessToken);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await apiClient.logout(accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and localStorage regardless of API call success
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Also clear cookies
      deleteCookie('token');
    }
  };

  const refreshAuth = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: ApiResponse<RefreshData> = await apiClient.refresh(refreshToken);

      if (response.success && response.data) {
        const { accessToken: newAccess, refreshToken: newRefresh } = response.data.tokens;
        setAccessToken(newAccess);
        localStorage.setItem('accessToken', newAccess);
        localStorage.setItem('refreshToken', newRefresh);
        
        // Also update cookie
        setCookie('token', newAccess);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      // Clear tokens if refresh fails
      logout();
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Add function to refetch user data from API
  const refetchUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.error('Refetch user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
    updateUser,
    refetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
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