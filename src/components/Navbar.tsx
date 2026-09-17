import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  RefreshCw,
  Terminal,
  Clock,
  KeyRound,
  FileCode2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface NavbarProps {
  onOpenProfile: () => void;
  onOpenApiDocs: () => void;
  onOpenAuditLogs?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenProfile, onOpenApiDocs }) => {
  const { user, role, logout, quickLoginAs, tokenExpiresAt, refreshTokens } = useAuth();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!tokenExpiresAt) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((tokenExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(left);
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenExpiresAt]);

  const handleManualRotate = async () => {
    setIsRefreshing(true);
    await refreshTokens();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getRoleBadgeColor = (r?: Role) => {
    switch (r) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'teacher':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'student':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg tracking-tight">EduSecure MERN</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  JWT + HttpOnly
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden md:block">Student Management System • RBAC Enforced</p>
            </div>
          </div>

          {/* Center Role Switcher / Demo Controls */}
          <div className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
            <span className="px-2 py-1 text-gray-500 font-medium">Demo Switch:</span>
            <button
              id="switch-admin-btn"
              onClick={() => quickLoginAs('admin')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                role === 'admin' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin
            </button>
            <button
              id="switch-teacher-btn"
              onClick={() => quickLoginAs('teacher')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                role === 'teacher' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Teacher
            </button>
            <button
              id="switch-student-btn"
              onClick={() => quickLoginAs('student')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                role === 'student' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Student
            </button>
          </div>

          {/* Right Section: API Explorer, Token Countdown & User Profile */}
          <div className="flex items-center gap-3">
            {/* Live Token Expiry Countdown */}
            {user && (
              <div
                title="Access Token TTL (15 min rotation with HttpOnly refresh cookies)"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  JWT: {Math.floor(secondsRemaining / 60)}:
                  {(secondsRemaining % 60).toString().padStart(2, '0')}
                </span>
                <button
                  id="rotate-token-btn"
                  onClick={handleManualRotate}
                  title="Rotate JWT pair now"
                  className="ml-1 text-amber-700 hover:text-amber-900 p-0.5 rounded hover:bg-amber-100"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}

            {/* REST API & Postman collection modal trigger */}
            <button
              id="open-api-docs-btn"
              onClick={onOpenApiDocs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">API & Postman</span>
            </button>

            {/* User Profile & Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <button
                  id="navbar-profile-btn"
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 text-left transition-colors"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{user.name}</p>
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </button>

                <button
                  id="navbar-logout-btn"
                  onClick={logout}
                  title="Sign out & revoke tokens"
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
