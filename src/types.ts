export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  isVerified: boolean;
  phone?: string;
  department?: string;
  studentId?: string;
  teacherId?: string;
  googleId?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  studentId: string;
  grade: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  enrollmentDate: string;
  status: 'active' | 'graduated' | 'suspended';
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  teacherId: string;
  department: string;
  specialization: string;
  qualification: string;
  joiningDate: string;
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  grade: string;
  section: string;
  teacherId: string;
  teacherName: string;
  room: string;
  studentCount: number;
}

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  teacherName: string;
  credits: number;
  classGrade: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  markedBy: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  classGrade: string;
  teacherId: string;
  teacherName: string;
  description: string;
  dueDate: string;
  attachmentUrl?: string;
  totalMarks: number;
  submissionsCount: number;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  examName: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  remarks: string;
  date: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'Academic' | 'Administrative' | 'Event' | 'Holiday';
  postedBy: string;
  postedRole: string;
  createdAt: string;
  isUrgent?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  userEmail: string;
  role: string;
  ip: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  details?: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  otp: string;
  purpose: 'signup' | 'login' | 'reset';
  timestamp: string;
  status: 'SENT' | 'SIMULATED';
}

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalUsers: number;
  attendanceRate: number;
  activeNotices: number;
  activeSessionsCount: number;
  securityEventsCount: number;
  systemSecurity: {
    rateLimiting: string;
    httpOnlyCookies: string;
    bcryptSaltRounds: number;
    rbacEnforced: string;
    headersProtected: string;
    injectionFilter: string;
  };
}

export interface StudentDashboardData {
  student: Student;
  attendanceStats: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    excusedDays: number;
    attendanceRate: number;
    records: AttendanceRecord[];
  };
  assignments: Assignment[];
  examResults: ExamResult[];
  notices: Notice[];
  subjects: SubjectItem[];
}
