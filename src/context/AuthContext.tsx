import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { api, setAccessToken, getStoredAccessToken } from '../utils/api';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenExpiresAt: number | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  requestOtp: (email: string) => Promise<{ success: boolean; previewOtp?: string; message?: string }>;
  loginWithGoogle: (customGoogleUser?: { name: string; email: string; avatar?: string }) => Promise<{ success: boolean; message?: string }>;
  register: (data: { name: string; email: string; password: string; role?: Role; phone?: string; department?: string }) => Promise<{ success: boolean; requiresOtp?: boolean; previewOtp?: string; message?: string }>;
  verifySignupOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; previewOtp?: string; message?: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ success: boolean; message?: string; user?: User }>;
  refreshTokens: () => Promise<boolean>;
  quickLoginAs: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);

  // Checks current session via /api/auth/me or refreshes cookie session
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ user: User }>('/api/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
        setTokenExpiresAt(Date.now() + 15 * 60 * 1000);
      } else {
        // Try refresh
        const refreshed = await api.post('/api/auth/refresh');
        if (refreshed.success && refreshed.accessToken) {
          setAccessToken(refreshed.accessToken);
          const meRes = await api.get<{ user: User }>('/api/auth/me');
          if (meRes.success && meRes.user) {
            setUser(meRes.user);
            setTokenExpiresAt(Date.now() + 15 * 60 * 1000);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
          setAccessToken(null);
        }
      }
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Periodic automatic token rotation before expiry (every 14 minutes)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      await refreshTokens();
    }, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const refreshTokens = async (): Promise<boolean> => {
    try {
      const res = await api.post('/api/auth/refresh');
      if (res.success && res.accessToken) {
        setAccessToken(res.accessToken);
        setTokenExpiresAt(Date.now() + 15 * 60 * 1000);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.success && res.user) {
      setUser(res.user);
      if (res.accessToken) setAccessToken(res.accessToken);
      setTokenExpiresAt(Date.now() + 15 * 60 * 1000);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const loginWithOtp = async (email: string, otp: string) => {
    const res = await api.post('/api/auth/verify-otp-login', { email, otp });
    if (res.success && res.user) {
      setUser(res.user);
      if (res.accessToken) setAccessToken(res.accessToken);
      setTokenExpiresAt(Date.now() + 15 * 60 * 1000);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'OTP verification failed' };
  };

  const requestOtp = async (email: string) => {
    const res = await api.post('/api/auth/request-otp-login', { email });
    return { success: res.success, previewOtp: res.previewOtp, message: res.message };
  };

  const loginWithGoogle = async (customGoogleUser?: { name: string; email: string; avatar?: string }) => {
    const googleProfile = customGoogleUser || {
      googleId: 'google-oauth-demo-user-id',
      email: 'student.google@school.edu',
      name: 'Alex Rivera (Google)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    const res = await api.post('/api/auth/google', googleProfile);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.accessToken) setAccessToken(res.accessToken);
      setTokenExpiresAt(Date.now() + 15 * 60 * 1000);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'Google sign-in failed' };
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    phone?: string;
    department?: string;
  }) => {
    const res = await api.post('/api/auth/register', data);
    return {
      success: res.success,
      requiresOtp: res.requiresOtp,
      previewOtp: res.previewOtp,
      message: res.message,
    };
  };

  const verifySignupOtp = async (email: string, otp: string) => {
    const res = await api.post('/api/auth/verify-otp-signup', { email, otp });
    if (res.success && res.user) {
      setUser(res.user);
      if (res.accessToken) setAccessToken(res.accessToken);
      setTokenExpiresAt(Date.now() + 15 * 60 * 1000);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'Signup verification failed' };
  };

  const forgotPassword = async (email: string) => {
    const res = await api.post('/api/auth/forgot-password', { email });
    return { success: res.success, previewOtp: res.previewOtp, message: res.message };
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const res = await api.post('/api/auth/reset-password', { email, otp, newPassword });
    return { success: res.success, message: res.message };
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
    setAccessToken(null);
    setTokenExpiresAt(null);
  };

  const updateProfile = async (data: any) => {
    const res = await api.put<{ user: User }>('/api/auth/profile', data);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, message: res.message, user: res.user };
    }
    return { success: false, message: res.message || 'Failed to update profile' };
  };

  const quickLoginAs = async (targetRole: Role) => {
    if (targetRole === 'admin') {
      await login('admin@school.edu', 'Admin123!');
    } else if (targetRole === 'teacher') {
      await login('teacher@school.edu', 'Teacher123!');
    } else {
      await login('student@school.edu', 'Student123!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        tokenExpiresAt,
        login,
        loginWithOtp,
        requestOtp,
        loginWithGoogle,
        register,
        verifySignupOtp,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
        refreshTokens,
        quickLoginAs,
      }}
    >
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
