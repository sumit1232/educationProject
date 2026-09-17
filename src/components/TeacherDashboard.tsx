import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  FileText,
  Upload,
  Trash2,
  Award,
  BookOpen,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { ClassItem, AttendanceRecord, Assignment, Student } from '../types';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('cls-01');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>>({});
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Assignment form
  const [asgTitle, setAsgTitle] = useState('');
  const [asgSubject, setAsgSubject] = useState('Data Structures & Algorithms');
  const [asgDueDate, setAsgDueDate] = useState('2026-09-30');
  const [asgMarks, setAsgMarks] = useState('50');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgFile, setAsgFile] = useState('https://res.cloudinary.com/demo/image/upload/sample.pdf');

  // Grade Entry Form
  const [gradeStudentId, setGradeStudentId] = useState('');
  const [gradeExamName, setGradeExamName] = useState('Fall Midterm 2026');
  const [gradeSubject, setGradeSubject] = useState('Data Structures & Algorithms');
  const [gradeMarks, setGradeMarks] = useState('88');
  const [gradeRemarks, setGradeRemarks] = useState('Good analytical precision.');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classRes, asgRes, stdRes] = await Promise.all([
        api.get<{ classes: ClassItem[] }>('/api/teacher/classes'),
        api.get<{ assignments: Assignment[] }>('/api/teacher/assignments'),
        api.get<{ students: Student[] }>('/api/admin/students'),
      ]);

      if (classRes.success && classRes.classes) {
        setClasses(classRes.classes);
        if (classRes.classes.length > 0 && !selectedClassId) {
          setSelectedClassId(classRes.classes[0].id);
        }
      }
      if (asgRes.success && asgRes.assignments) setAssignments(asgRes.assignments);
      if (stdRes.success && stdRes.students) {
        setStudents(stdRes.students);
        if (stdRes.students.length > 0 && !gradeStudentId) {
          setGradeStudentId(stdRes.students[0].id);
        }

        // Initialize default attendance map
        const initialMap: Record<string, any> = {};
        stdRes.students.forEach((s) => {
          initialMap[s.id] = 'Present';
        });
        setAttendanceMap(initialMap);
      }

      // Check existing attendance for this date
      const attRes = await api.get<{ attendance: AttendanceRecord[] }>(
        `/api/teacher/attendance?classId=${selectedClassId}&date=${attendanceDate}`
      );
      if (attRes.success && attRes.attendance && attRes.attendance.length > 0) {
        const existing: Record<string, any> = {};
        attRes.attendance.forEach((r) => {
          existing[r.studentId] = r.status;
        });
        setAttendanceMap((prev) => ({ ...prev, ...existing }));
      }
    } catch {
      setMessage({ text: 'Failed to fetch teacher portal data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId, attendanceDate]);

  const handleStatusToggle = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'Present' | 'Absent') => {
    const updated: Record<string, any> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    setLoading(true);
    const records = students.map((s) => ({
      studentId: s.id,
      studentName: s.name,
      status: attendanceMap[s.id] || 'Present',
    }));

    const res = await api.post('/api/teacher/attendance', {
      classId: selectedClassId,
      date: attendanceDate,
      records,
    });
    setLoading(false);
    if (res.success) {
      setMessage({ text: res.message || 'Attendance saved successfully!', type: 'success' });
    } else {
      setMessage({ text: res.message || 'Failed to save attendance.', type: 'error' });
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle || !asgSubject) return;

    setLoading(true);
    const res = await api.post('/api/teacher/assignments', {
      title: asgTitle,
      subject: asgSubject,
      dueDate: asgDueDate,
      totalMarks: Number(asgMarks) || 50,
      description: asgDesc,
      attachmentUrl: asgFile,
    });
    setLoading(false);

    if (res.success) {
      setMessage({ text: 'Assignment published for all enrolled students!', type: 'success' });
      setAsgTitle('');
      setAsgDesc('');
      loadData();
    } else {
      setMessage({ text: res.message || 'Could not publish assignment.', type: 'error' });
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    const res = await api.delete(`/api/teacher/assignments/${id}`);
    if (res.success) {
      setMessage({ text: 'Assignment deleted.', type: 'success' });
      loadData();
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === gradeStudentId);
    if (!student) return;

    setLoading(true);
    const res = await api.post('/api/teacher/grades', {
      studentId: student.id,
      studentName: student.name,
      examName: gradeExamName,
      subject: gradeSubject,
      marksObtained: Number(gradeMarks),
      totalMarks: 100,
      remarks: gradeRemarks,
    });
    setLoading(false);

    if (res.success) {
      setMessage({ text: `Exam grade recorded for ${student.name}!`, type: 'success' });
    } else {
      setMessage({ text: res.message || 'Could not submit grade.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-1">
            <BookOpen className="w-3 h-3" />
            Faculty Portal
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Faculty Academic Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Record student attendance, distribute assignments, and submit official grade marks.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* 1. Daily Attendance Tracker */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Class Attendance Roll Call</h2>
            <p className="text-xs text-gray-500">Record Present, Late, Absent, or Excused status for each student.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="py-1.5 px-3 text-xs border border-gray-300 rounded-lg bg-white outline-hidden font-medium"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.room})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="py-1.5 px-3 text-xs border border-gray-300 rounded-lg bg-white outline-hidden font-medium"
            />

            <button
              onClick={() => handleMarkAll('Present')}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              All Present
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden mb-4">
          {students.map((student) => {
            const currentStatus = attendanceMap[student.id] || 'Present';
            return (
              <div key={student.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs">{student.name}</h3>
                    <p className="text-[11px] text-gray-500 font-mono">
                      {student.studentId} • {student.grade} - {student.section}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['Present', 'Late', 'Absent', 'Excused'] as const).map((status) => {
                    const isSelected = currentStatus === status;
                    let colorClass = 'text-gray-600 bg-gray-50 border-gray-200';
                    if (isSelected) {
                      if (status === 'Present') colorClass = 'bg-emerald-600 text-white border-emerald-600';
                      if (status === 'Late') colorClass = 'bg-amber-500 text-white border-amber-500';
                      if (status === 'Absent') colorClass = 'bg-red-600 text-white border-red-600';
                      if (status === 'Excused') colorClass = 'bg-blue-600 text-white border-blue-600';
                    }
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusToggle(student.id, status)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${colorClass}`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveAttendance}
            disabled={loading}
            className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors shadow-xs"
          >
            Save Attendance for {attendanceDate}
          </button>
        </div>
      </div>

      {/* 2. Assignments & Grade Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create & Manage Assignments */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Publish Academic Assignment</h2>
          </div>

          <form onSubmit={handleCreateAssignment} className="space-y-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Assignment Title</label>
              <input
                type="text"
                required
                value={asgTitle}
                onChange={(e) => setAsgTitle(e.target.value)}
                placeholder="e.g. Graph Algorithms & Shortest Path Proofs"
                className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={asgSubject}
                  onChange={(e) => setAsgSubject(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={asgDueDate}
                  onChange={(e) => setAsgDueDate(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description & Instructions</label>
              <textarea
                rows={2}
                value={asgDesc}
                onChange={(e) => setAsgDesc(e.target.value)}
                placeholder="Include formatting requirements and grading criteria..."
                className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Upload className="w-3 h-3" /> Cloudinary signed URL ready
              </span>
              <button
                type="submit"
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors"
              >
                Distribute Assignment
              </button>
            </div>
          </form>

          {/* Active Assignments */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Active Assignments</h3>
            <div className="space-y-2">
              {assignments.map((asg) => (
                <div key={asg.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-xs">{asg.title}</h4>
                    <p className="text-[11px] text-gray-500">
                      {asg.subject} • Due {asg.dueDate} • {asg.totalMarks} Marks
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
                      {asg.submissionsCount || 0} Submissions
                    </span>
                    <button
                      onClick={() => handleDeleteAssignment(asg.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enter Exam Grades */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">Submit Exam Marks & Results</h2>
          </div>

          <form onSubmit={handleSubmitGrade} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
              <select
                value={gradeStudentId}
                onChange={(e) => setGradeStudentId(e.target.value)}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg bg-white outline-hidden"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Examination</label>
                <input
                  type="text"
                  required
                  value={gradeExamName}
                  onChange={(e) => setGradeExamName(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={gradeSubject}
                  onChange={(e) => setGradeSubject(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Marks Obtained (Out of 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teacher Remarks</label>
                <input
                  type="text"
                  value={gradeRemarks}
                  onChange={(e) => setGradeRemarks(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition-colors shadow-xs"
            >
              Record Official Grade
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
