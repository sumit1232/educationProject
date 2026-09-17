import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Key,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Phone,
  Copy,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role, EmailLog } from '../types';
import { api } from '../utils/api';

type AuthMode = 'login-password' | 'login-otp' | 'register' | 'verify-otp' | 'forgot-password' | 'reset-password';

export const AuthView: React.FC = () => {
  const { login, loginWithOtp, requestOtp, loginWithGoogle, register, verifySignupOtp, forgotPassword, resetPassword, quickLoginAs } =
    useAuth();

  const [mode, setMode] = useState<AuthMode>('login-password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  // Email Logs for development preview of simulated OTPs
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.get<{ logs: EmailLog[] }>('/api/auth/email-logs');
      if (res.success && res.logs) {
        setEmailLogs(res.logs);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const resetFormAlerts = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Invalid credentials');
    }
  };

  const handleRequestLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    if (!email) {
      setErrorMessage('Please enter your registered email.');
      return;
    }
    setLoading(true);
    const res = await requestOtp(email);
    setLoading(false);
    if (res.success) {
      setSuccessMessage('OTP code generated and sent! Check below or the email inspector.');
      if (res.previewOtp) setPreviewOtp(res.previewOtp);
      fetchLogs();
    } else {
      setErrorMessage(res.message || 'Failed to send login OTP.');
    }
  };

  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    setLoading(true);
    const res = await loginWithOtp(email, otp);
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Invalid OTP code.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    setLoading(true);
    const res = await register({ name, email, password, role, phone });
    setLoading(false);
    if (res.success) {
      if (res.previewOtp) setPreviewOtp(res.previewOtp);
      setSuccessMessage('Account created! Please enter the 6-digit OTP code to verify.');
      setMode('verify-otp');
      fetchLogs();
    } else {
      setErrorMessage(res.message || 'Registration failed.');
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    setLoading(true);
    const res = await verifySignupOtp(email, otp);
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.message || 'Failed to verify account.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    if (!email) {
      setErrorMessage('Please enter your email.');
      return;
    }
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res.success) {
      if (res.previewOtp) setPreviewOtp(res.previewOtp);
      setSuccessMessage('Recovery code generated. Please enter the OTP and your new password.');
      setMode('reset-password');
      fetchLogs();
    } else {
      setErrorMessage(res.message || 'Could not initiate password reset.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormAlerts();
    setLoading(true);
    const res = await resetPassword(email, otp, newPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setMode('login-password');
      setPassword('');
      setOtp('');
    } else {
      setErrorMessage(res.message || 'Failed to reset password.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOtp(text);
    setOtp(text);
    setTimeout(() => setCopiedOtp(null), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Authentication Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Authentication Suite
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {mode === 'login-password' && 'Sign in with Password'}
              {mode === 'login-otp' && 'Passwordless Email OTP Login'}
              {mode === 'register' && 'Create Student / Faculty Account'}
              {mode === 'verify-otp' && 'Verify Email with OTP'}
              {mode === 'forgot-password' && 'Password Recovery'}
              {mode === 'reset-password' && 'Set New Password'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Short-lived JWT access tokens in HttpOnly cookies, bcrypt hashing, and role-based access.
            </p>
          </div>

          {/* Quick Demo Login Presets */}
          <div className="mb-6 p-3 bg-slate-100/80 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
              Instant 1-Click Demo Logins:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="demo-admin-login-btn"
                onClick={() => quickLoginAs('admin')}
                className="px-2.5 py-2 text-xs font-medium bg-white text-purple-700 hover:bg-purple-50 border border-purple-200 rounded-lg shadow-2xs transition-colors flex flex-col items-center"
              >
                <span className="font-bold">Admin</span>
                <span className="text-[10px] text-gray-500">Dr. Vance</span>
              </button>
              <button
                id="demo-teacher-login-btn"
                onClick={() => quickLoginAs('teacher')}
                className="px-2.5 py-2 text-xs font-medium bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg shadow-2xs transition-colors flex flex-col items-center"
              >
                <span className="font-bold">Teacher</span>
                <span className="text-[10px] text-gray-500">Prof. Brody</span>
              </button>
              <button
                id="demo-student-login-btn"
                onClick={() => quickLoginAs('student')}
                className="px-2.5 py-2 text-xs font-medium bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-colors flex flex-col items-center"
              >
                <span className="font-bold">Student</span>
                <span className="text-[10px] text-gray-500">Alex Rivera</span>
              </button>
            </div>
          </div>

          {/* Notifications */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p>{successMessage}</p>
                {previewOtp && (
                  <p className="mt-1 font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded inline-block">
                    Code: {previewOtp}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form Switchers */}
          <div className="flex border-b border-gray-200 mb-6 text-xs font-medium">
            <button
              id="tab-password-login"
              onClick={() => {
                setMode('login-password');
                resetFormAlerts();
              }}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                mode === 'login-password'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Password Login
            </button>
            <button
              id="tab-otp-login"
              onClick={() => {
                setMode('login-otp');
                resetFormAlerts();
              }}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                mode === 'login-otp'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Email OTP Login
            </button>
            <button
              id="tab-register"
              onClick={() => {
                setMode('register');
                resetFormAlerts();
              }}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                mode === 'register' || mode === 'verify-otp'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Register
            </button>
          </div>

          {/* 1. Password Login Form */}
          {mode === 'login-password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@school.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      resetFormAlerts();
                    }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                id="submit-password-login-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Sign In with Credentials
              </button>
            </form>
          )}

          {/* 2. OTP Login Form */}
          {mode === 'login-otp' && (
            <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Registered Email Address</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="otp-login-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@school.edu"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestLoginOtp}
                    disabled={loading || !email}
                    className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-gray-700 transition-colors whitespace-nowrap"
                  >
                    Send OTP
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">6-Digit Email Verification Code</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="otp-login-code-input"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg font-mono tracking-widest text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                id="submit-otp-login-btn"
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Verify OTP & Sign In
              </button>
            </form>
          )}

          {/* 3. Registration Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="register-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Role</label>
                  <select
                    id="register-role-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher / Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@school.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password (bcrypt 12+)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="register-password-input"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      id="register-phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Register & Receive Verification OTP
              </button>
            </form>
          )}

          {/* 4. Verify OTP Step (Signup) */}
          {mode === 'verify-otp' && (
            <form onSubmit={handleVerifySignupOtp} className="space-y-4">
              <p className="text-xs text-gray-600">
                We have sent an OTP code to <strong className="text-gray-900">{email}</strong>. Please enter the 6 digits below
                to activate your account.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verification Code</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="verify-otp-input"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg font-mono tracking-widest text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                id="submit-verify-otp-btn"
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm OTP & Activate Session
              </button>
            </form>
          )}

          {/* 5. Forgot Password */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    id="forgot-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@school.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                id="submit-forgot-password-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Send Password Reset OTP
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login-password')}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  Return to sign in
                </button>
              </div>
            </form>
          )}

          {/* 6. Reset Password */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">OTP Reset Code</label>
                <input
                  id="reset-otp-input"
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg font-mono text-center outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password (Min. 8 chars)</label>
                <input
                  id="reset-new-password-input"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New secure password"
                  className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                id="submit-reset-password-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password with bcrypt 12
              </button>
            </form>
          )}

          {/* Third-Party Google OAuth Option */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              id="google-oauth-login-btn"
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full py-2.5 px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition-colors shadow-2xs flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              Sign in with Google OAuth 2.0 (Passport.js)
            </button>
          </div>
        </div>

        {/* Right column: Live Security Architecture & OTP Delivery Inbox */}
        <div className="lg:col-span-5 space-y-6">
          {/* Security Features Checklist */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-900 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Security Hardening Active
            </div>
            <ul className="space-y-2.5 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>bcrypt hashing:</strong> 12+ salt rounds with crypto-random salting.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>HttpOnly Cookies:</strong> Prevents XSS token exfiltration.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Token Rotation:</strong> Refresh tokens invalidated on every cycle.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Rate Limiting:</strong> express-rate-limit prevents brute-force.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Injection Guard:</strong> Mongoose-compliant query sanitization.
                </span>
              </li>
            </ul>
          </div>

          {/* Real-Time Email OTP Inbox Simulator */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Live Email OTP Dispatch Inspector</span>
              </div>
              <button
                onClick={fetchLogs}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Simulated Nodemailer inbox. Dispatched OTP verification codes appear here in real-time.
            </p>

            {emailLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800/80">
                No OTPs dispatched yet. Request a code above!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {emailLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-emerald-400 font-bold tracking-wider">{log.otp}</span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                          {log.purpose}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">To: {log.to}</p>
                    </div>

                    <button
                      onClick={() => copyToClipboard(log.otp)}
                      className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium shrink-0 flex items-center gap-1"
                    >
                      {copiedOtp === log.otp ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Use
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
