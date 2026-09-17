import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Award,
  Upload,
  Download,
  Bell,
  Sparkles,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { StudentDashboardData, Assignment } from '../types';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitModalAsg, setSubmitModalAsg] = useState<Assignment | null>(null);
  const [solutionNotes, setSolutionNotes] = useState('');
  const [solutionFile, setSolutionFile] = useState('https://res.cloudinary.com/demo/image/upload/sample.pdf');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get<StudentDashboardData>('/api/student/dashboard');
      if (res.success && res.student) {
        setData(res as any);
      }
    } catch {
      setStatusMsg({ text: 'Failed to load student records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalAsg) return;

    const res = await api.post('/api/student/assignments/submit', {
      assignmentId: submitModalAsg.id,
      solutionNotes,
      fileUrl: solutionFile,
    });

    if (res.success) {
      setStatusMsg({ text: 'Assignment solution submitted successfully!', type: 'success' });
      setSubmitModalAsg(null);
      setSolutionNotes('');
      loadData();
    } else {
      setStatusMsg({ text: res.message || 'Submission failed.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl border-2 border-indigo-100 shadow-2xs object-cover"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-1">
              <GraduationCap className="w-3 h-3" />
              Student Academic Portal
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome, {user?.name}</h1>
            <p className="text-xs text-gray-500">
              Student ID: <span className="font-mono font-semibold text-gray-800">{user?.studentId || 'STU-2026-001'}</span> •{' '}
              {user?.department || 'Grade 11 - Section A'}
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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

      {/* Grid: Attendance Analytics & Digital ID Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Summary */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Attendance Standing</h2>
              <p className="text-xs text-gray-500">Official verified presence record for current term.</p>
            </div>
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full border ${
                (data?.attendanceStats?.attendanceRate ?? 92) >= 85
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {data?.attendanceStats?.attendanceRate ?? 92}% Overall Rate
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center mb-6">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <span className="text-xs text-emerald-800 font-medium block">Present</span>
              <span className="text-xl font-bold text-emerald-900">{data?.attendanceStats?.presentDays ?? 7}</span>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
              <span className="text-xs text-amber-800 font-medium block">Late</span>
              <span className="text-xl font-bold text-amber-900">{data?.attendanceStats?.lateDays ?? 1}</span>
            </div>
            <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl">
              <span className="text-xs text-red-800 font-medium block">Absent</span>
              <span className="text-xl font-bold text-red-900">{data?.attendanceStats?.absentDays ?? 1}</span>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
              <span className="text-xs text-blue-800 font-medium block">Excused</span>
              <span className="text-xl font-bold text-blue-900">{data?.attendanceStats?.excusedDays ?? 1}</span>
            </div>
          </div>

          {/* Recent Attendance Entries */}
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Recent Attendance Log</h3>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl max-h-40 overflow-y-auto">
            {(data?.attendanceStats?.records || []).slice(0, 5).map((att) => (
              <div key={att.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-gray-50">
                <span className="font-mono text-gray-600">{att.date}</span>
                <span className="text-gray-500">Marked by {att.markedBy}</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    att.status === 'Present'
                      ? 'bg-emerald-100 text-emerald-800'
                      : att.status === 'Late'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {att.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Student ID Badge Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-slate-800 shadow-md p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm tracking-wide">EduSecure Institute</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                Active Student
              </span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-16 h-16 rounded-xl border-2 border-indigo-400/30 object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-base font-bold text-white">{user?.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.studentId || 'STU-2026-001'}</p>
                <p className="text-xs text-indigo-300 mt-0.5">{user?.department || 'Grade 11 Science'}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-mono">Authentication</span>
              <span className="text-slate-200">Verified & Encrypted</span>
            </div>
            <QrCode className="w-8 h-8 text-slate-300" />
          </div>
        </div>
      </div>

      {/* Grid: Assignments & Exam Transcripts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assignments Portal */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Assigned Homework & Projects</h2>
              <p className="text-xs text-gray-500">Submit completed files and track grades.</p>
            </div>
          </div>

          <div className="space-y-3">
            {(data?.assignments || []).map((asg) => (
              <div key={asg.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">
                      {asg.subject}
                    </span>
                    <span className="text-xs font-mono text-gray-500">Due: {asg.dueDate}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mt-1">{asg.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{asg.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">{asg.totalMarks} Total Marks</span>
                  <button
                    onClick={() => setSubmitModalAsg(asg)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" /> Submit Response
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Results & Transcripts */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">Academic Transcripts & Grades</h2>
          </div>

          <div className="space-y-3">
            {(data?.examResults || []).map((res) => (
              <div key={res.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-xs">{res.subject}</h4>
                    <span className="text-[10px] text-gray-500">({res.examName})</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 italic">"{res.remarks}"</p>
                  <span className="text-[11px] text-gray-400 font-mono mt-0.5 block">{res.date}</span>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-sm border border-emerald-200">
                    {res.grade}
                  </div>
                  <span className="block text-xs font-bold text-gray-700 mt-1">
                    {res.marksObtained}/{res.totalMarks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campus Notices */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-indigo-600" />
          <h2 className="text-base font-bold text-gray-900">Campus Bulletins & Notices</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data?.notices || []).map((notice) => (
            <div
              key={notice.id}
              className={`p-4 rounded-xl border ${
                notice.isUrgent ? 'bg-red-50/60 border-red-200' : 'bg-gray-50/60 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    notice.isUrgent ? 'bg-red-200 text-red-800' : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {notice.category}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-bold text-gray-900 text-xs mb-1">{notice.title}</h4>
              <p className="text-xs text-gray-600 line-clamp-3">{notice.content}</p>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">By: {notice.postedBy}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Modal */}
      {submitModalAsg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Submit Solution</h3>
              <button onClick={() => setSubmitModalAsg(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Submitting for: <strong className="text-gray-900">{submitModalAsg.title}</strong>
            </p>

            <form onSubmit={handleSubmitSolution} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Response Notes / Explanations</label>
                <textarea
                  required
                  rows={3}
                  value={solutionNotes}
                  onChange={(e) => setSolutionNotes(e.target.value)}
                  placeholder="Summarize your findings, formulas used, or repository link..."
                  className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cloudinary File Attachment URL</label>
                <input
                  type="text"
                  value={solutionFile}
                  onChange={(e) => setSolutionFile(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalAsg(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Confirm Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
