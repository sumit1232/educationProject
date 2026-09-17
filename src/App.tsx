import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/AuthView';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { ApiExplorerModal } from './components/ApiExplorerModal';
import { ShieldCheck, Server, Key, Lock, Users } from 'lucide-react';
import { Role } from './types';

const MainLayout: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const [activePortalTab, setActivePortalTab] = useState<Role | 'auto'>('auto');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-700">Verifying JWT Session & Security Credentials...</p>
      </div>
    );
  }

  // Determine current active dashboard portal view
  const currentViewRole: Role = activePortalTab === 'auto' ? user?.role || 'student' : activePortalTab;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-gray-900 font-sans antialiased">
      <Navbar onOpenProfile={() => setIsProfileOpen(true)} onOpenApiDocs={() => setIsApiDocsOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          <AuthView />
        ) : (
          <div className="space-y-6">
            {/* Role Portal Navigator (Allows administrative or testing users to explore all 3 role perspectives) */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 pl-2">Current View:</span>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    id="tab-view-admin"
                    onClick={() => setActivePortalTab('admin')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      currentViewRole === 'admin'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Admin Portal
                  </button>
                  <button
                    id="tab-view-teacher"
                    onClick={() => setActivePortalTab('teacher')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      currentViewRole === 'teacher'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Teacher Portal
                  </button>
                  <button
                    id="tab-view-student"
                    onClick={() => setActivePortalTab('student')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      currentViewRole === 'student'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Student Portal
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 pr-2">
                <span className="hidden sm:inline">Signed in as:</span>
                <span className="font-semibold text-gray-900">{user.email}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-bold uppercase">
                  Account: {user.role}
                </span>
              </div>
            </div>

            {/* Role-Specific Portal View */}
            {currentViewRole === 'admin' && <AdminDashboard />}
            {currentViewRole === 'teacher' && <TeacherDashboard />}
            {currentViewRole === 'student' && <StudentDashboard />}
          </div>
        )}
      </main>

      {/* Footer Security Badges */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-gray-800">EduSecure MERN Stack</span>
            <span>• Node.js / Express 4.21 • React 19 • Vite • Tailwind CSS</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" /> bcrypt 12 Salt Rounds
            </span>
            <span className="flex items-center gap-1">
              <Key className="w-3 h-3 text-indigo-600" /> JWT in HttpOnly Cookies
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-600" /> RBAC Enforced
            </span>
            <span className="flex items-center gap-1">
              <Server className="w-3 h-3 text-blue-600" /> Helmet & Rate Limiter
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProfileSettingsModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <ApiExplorerModal isOpen={isApiDocsOpen} onClose={() => setIsApiDocsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
