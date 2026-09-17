import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Bell,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Calendar,
} from 'lucide-react';
import { User, Student, Teacher, ClassItem, Notice, AuditLog, AdminStats } from '../types';
import { api } from '../utils/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // New Notice form
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'Academic' | 'Administrative' | 'Event' | 'Holiday'>('Academic');
  const [noticeUrgent, setNoticeUrgent] = useState(false);

  // New Class form
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('Grade 11');
  const [newClassSection, setNewClassSection] = useState('A');
  const [newClassTeacher, setNewClassTeacher] = useState('Prof. Marcus Brody');
  const [newClassRoom, setNewClassRoom] = useState('Room 101');

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, classesRes, noticesRes, logsRes] = await Promise.all([
        api.get<{ stats: AdminStats }>('/api/admin/stats'),
        api.get<{ users: User[] }>('/api/admin/users'),
        api.get<{ classes: ClassItem[] }>('/api/admin/classes'),
        api.get<{ notices: Notice[] }>('/api/admin/notices'),
        api.get<{ logs: AuditLog[] }>('/api/admin/audit-logs'),
      ]);

      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      if (usersRes.success && usersRes.users) setUsers(usersRes.users);
      if (classesRes.success && classesRes.classes) setClasses(classesRes.classes);
      if (noticesRes.success && noticesRes.notices) setNotices(noticesRes.notices);
      if (logsRes.success && logsRes.logs) setAuditLogs(logsRes.logs);
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to load administrative dashboard records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message || 'User role updated.' });
      loadData();
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Could not update role.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will also remove student/teacher records.')) return;
    const res = await api.delete(`/api/admin/users/${userId}`);
    if (res.success) {
      setStatusMsg({ type: 'success', text: 'User removed.' });
      loadData();
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Failed to delete user.' });
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;
    const res = await api.post('/api/admin/notices', {
      title: noticeTitle,
      content: noticeContent,
      category: noticeCategory,
      isUrgent: noticeUrgent,
    });
    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Notice broadcasted across all student and faculty portals!' });
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeUrgent(false);
      loadData();
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Failed to publish notice.' });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    const res = await api.post('/api/admin/classes', {
      name: newClassName,
      grade: newClassGrade,
      section: newClassSection,
      teacherName: newClassTeacher,
      room: newClassRoom,
    });
    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Classroom added successfully!' });
      setShowClassModal(false);
      setNewClassName('');
      loadData();
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('Reset entire system database to clean factory demo data?')) return;
    const res = await api.post('/api/admin/reset-database');
    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Database restored to factory demo state!' });
      loadData();
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-1">
            <Sliders className="w-3 h-3" />
            Administrative Portal
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Control & Administration</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Role-Based Access Control, live session monitoring, class scheduling, and security compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-refresh-btn"
            onClick={loadData}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            title="Refresh administrative data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="admin-reset-db-btn"
            onClick={handleResetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors"
            title="Restore default test data and pre-hashed credentials"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Factory Data
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Students</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents ?? '-'}</p>
          <span className="text-[11px] text-gray-500">Active enrollments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Faculty</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalTeachers ?? '-'}</p>
          <span className="text-[11px] text-gray-500">Teachers registered</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Classrooms</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalClasses ?? '-'}</p>
          <span className="text-[11px] text-gray-500">Active schedules</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Avg. Attendance</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.attendanceRate ?? 92}%</p>
          <span className="text-[11px] text-emerald-600 font-medium">Campus-wide rate</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">Active JWTs</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.activeSessionsCount ?? 1}</p>
          <span className="text-[11px] text-purple-600 font-medium">HttpOnly sessions</span>
        </div>
      </div>

      {/* Security Hardening Status Matrix */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            System Security Architecture & Defensive Stack
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[11px]">Password Encryption</span>
            <span className="font-semibold text-emerald-400">bcrypt (12 rounds)</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[11px]">JWT Session Guard</span>
            <span className="font-semibold text-indigo-300">HttpOnly + Rotation</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[11px]">Headers & Injection</span>
            <span className="font-semibold text-emerald-400">Helmet v8 + NoSQL Filter</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-slate-400 block text-[11px]">Brute Force Guard</span>
            <span className="font-semibold text-amber-300">express-rate-limit</span>
          </div>
        </div>
      </div>

      {/* Users & RBAC Management Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">User Directory & Role Permissions (RBAC)</h2>
            <p className="text-xs text-gray-500">Manage institutional users and promote or revoke permissions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user or ID..."
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-purple-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="py-1.5 px-3 text-xs border border-gray-300 rounded-lg bg-white outline-hidden focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Department / ID</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                        alt={u.name}
                        className="w-7 h-7 rounded-full border border-gray-200 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-semibold text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="py-1 px-2 text-xs border border-gray-300 rounded-md font-medium bg-white outline-hidden focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                    {u.studentId || u.teacherId || u.department || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Classroom Schedule & Notice Broadcaster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Classrooms */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Classrooms & Sections</h2>
              <p className="text-xs text-gray-500">Assigned teachers and room locations.</p>
            </div>
            <button
              onClick={() => setShowClassModal(!showClassModal)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Class
            </button>
          </div>

          {showClassModal && (
            <form onSubmit={handleCreateClass} className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <input
                type="text"
                required
                placeholder="Class Name (e.g. Physics 101)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs border border-gray-300 rounded-md bg-white outline-hidden"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Grade (e.g. Grade 11)"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="py-1.5 px-2.5 text-xs border border-gray-300 rounded-md bg-white outline-hidden"
                />
                <input
                  type="text"
                  placeholder="Room (e.g. Room 204)"
                  value={newClassRoom}
                  onChange={(e) => setNewClassRoom(e.target.value)}
                  className="py-1.5 px-2.5 text-xs border border-gray-300 rounded-md bg-white outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Classroom
              </button>
            </form>
          )}

          <div className="space-y-2.5">
            {classes.map((cls) => (
              <div key={cls.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-xs">{cls.name}</h3>
                  <p className="text-[11px] text-gray-500">
                    {cls.grade} • Sec {cls.section} • {cls.room}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-gray-700 font-medium block">{cls.teacherName}</span>
                  <span className="text-[11px] text-gray-400">{cls.studentCount || 25} enrolled</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notice Broadcaster */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Broadcast Campus Notice</h2>
          </div>

          <form onSubmit={handleCreateNotice} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notice Headline</label>
              <input
                type="text"
                required
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="e.g. Semester Exam Schedules Finalized"
                className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value as any)}
                  className="w-full py-1.5 px-2 text-xs border border-gray-300 rounded-lg bg-white outline-hidden"
                >
                  <option value="Academic">Academic</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Event">Campus Event</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>

              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticeUrgent}
                    onChange={(e) => setNoticeUrgent(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Mark as Urgent Notice</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Announcement Details</label>
              <textarea
                required
                rows={2}
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                placeholder="Details of the announcement for students and faculty..."
                className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors"
            >
              Publish Notice Across Portals
            </button>
          </form>
        </div>
      </div>

      {/* Live Security Audit Logs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Live Security Audit Log</h2>
            <p className="text-xs text-gray-500">Automated event stream of logins, token rotations, and RBAC actions.</p>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">{auditLogs.length} events recorded</span>
        </div>

        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl">
          {auditLogs.slice(0, 20).map((log) => (
            <div key={log.id} className="p-3 flex items-start justify-between gap-4 text-xs hover:bg-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="font-semibold text-gray-800">{log.userEmail}</span>
                  <span className="text-gray-400">({log.role})</span>
                </div>
                <p className="text-gray-600 mt-0.5">{log.details}</p>
              </div>
              <span className="text-[11px] text-gray-400 font-mono whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
