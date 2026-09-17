import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

export interface UserDoc {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'teacher' | 'student';
  avatar: string;
  isVerified: boolean;
  googleId?: string;
  phone?: string;
  createdAt: string;
  department?: string;
  studentId?: string;
  teacherId?: string;
}

export interface StudentDoc {
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

export interface TeacherDoc {
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

export interface ClassDoc {
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

export interface SubjectDoc {
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

export interface AssignmentDoc {
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

export interface ExamResultDoc {
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

export interface NoticeDoc {
  id: string;
  title: string;
  content: string;
  category: 'Academic' | 'Administrative' | 'Event' | 'Holiday';
  postedBy: string;
  postedRole: string;
  createdAt: string;
  isUrgent?: boolean;
}

export interface AuditLogDoc {
  id: string;
  action: string;
  userEmail: string;
  role: string;
  ip: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  details?: string;
}

export interface OtpRecord {
  email: string;
  otp: string;
  type: 'signup' | 'login' | 'reset';
  expiresAt: number;
}

export interface DbSchema {
  users: UserDoc[];
  students: StudentDoc[];
  teachers: TeacherDoc[];
  classes: ClassDoc[];
  subjects: SubjectDoc[];
  attendance: AttendanceRecord[];
  assignments: AssignmentDoc[];
  examResults: ExamResultDoc[];
  notices: NoticeDoc[];
  otps: OtpRecord[];
  refreshTokens: { token: string; userId: string; expiresAt: number }[];
  auditLogs: AuditLogDoc[];
}

function getInitialData(): DbSchema {
  // Pre-hashed passwords with 12 salt rounds for "Admin123!", "Teacher123!", "Student123!"
  const adminPass = bcrypt.hashSync('Admin123!', 12);
  const teacherPass = bcrypt.hashSync('Teacher123!', 12);
  const studentPass = bcrypt.hashSync('Student123!', 12);

  return {
    users: [
      {
        id: 'usr-admin-01',
        name: 'Dr. Eleanor Vance',
        email: 'admin@school.edu',
        passwordHash: adminPass,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        isVerified: true,
        phone: '+1 (555) 234-5678',
        createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
        department: 'Administration',
      },
      {
        id: 'usr-teacher-01',
        name: 'Prof. Marcus Brody',
        email: 'teacher@school.edu',
        passwordHash: teacherPass,
        role: 'teacher',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80',
        isVerified: true,
        phone: '+1 (555) 345-6789',
        createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
        department: 'Computer Science',
        teacherId: 'TCH-101',
      },
      {
        id: 'usr-teacher-02',
        name: 'Dr. Sarah Connor',
        email: 's.connor@school.edu',
        passwordHash: teacherPass,
        role: 'teacher',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        isVerified: true,
        phone: '+1 (555) 456-7890',
        createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
        department: 'Mathematics',
        teacherId: 'TCH-102',
      },
      {
        id: 'usr-student-01',
        name: 'Alex Rivera',
        email: 'student@school.edu',
        passwordHash: studentPass,
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isVerified: true,
        phone: '+1 (555) 987-6543',
        createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
        department: 'Grade 11 - Science',
        studentId: 'STU-2026-001',
      },
      {
        id: 'usr-student-02',
        name: 'Chloe Zhao',
        email: 'chloe.z@school.edu',
        passwordHash: studentPass,
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        isVerified: true,
        phone: '+1 (555) 678-1234',
        createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
        department: 'Grade 11 - Science',
        studentId: 'STU-2026-002',
      },
      {
        id: 'usr-student-03',
        name: 'Liam Henderson',
        email: 'liam.h@school.edu',
        passwordHash: studentPass,
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isVerified: true,
        phone: '+1 (555) 432-8765',
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        department: 'Grade 11 - Science',
        studentId: 'STU-2026-003',
      }
    ],
    students: [
      {
        id: 'std-01',
        userId: 'usr-student-01',
        name: 'Alex Rivera',
        email: 'student@school.edu',
        studentId: 'STU-2026-001',
        grade: 'Grade 11',
        section: 'A',
        guardianName: 'Elena Rivera',
        guardianPhone: '+1 (555) 901-2345',
        enrollmentDate: '2024-09-01',
        status: 'active'
      },
      {
        id: 'std-02',
        userId: 'usr-student-02',
        name: 'Chloe Zhao',
        email: 'chloe.z@school.edu',
        studentId: 'STU-2026-002',
        grade: 'Grade 11',
        section: 'A',
        guardianName: 'Wei Zhao',
        guardianPhone: '+1 (555) 789-0123',
        enrollmentDate: '2024-09-01',
        status: 'active'
      },
      {
        id: 'std-03',
        userId: 'usr-student-03',
        name: 'Liam Henderson',
        email: 'liam.h@school.edu',
        studentId: 'STU-2026-003',
        grade: 'Grade 11',
        section: 'A',
        guardianName: 'Robert Henderson',
        guardianPhone: '+1 (555) 654-3210',
        enrollmentDate: '2024-09-01',
        status: 'active'
      }
    ],
    teachers: [
      {
        id: 'tch-01',
        userId: 'usr-teacher-01',
        name: 'Prof. Marcus Brody',
        email: 'teacher@school.edu',
        teacherId: 'TCH-101',
        department: 'Computer Science',
        specialization: 'Software Architecture & Algorithms',
        qualification: 'Ph.D. in Computer Science',
        joiningDate: '2021-08-15'
      },
      {
        id: 'tch-02',
        userId: 'usr-teacher-02',
        name: 'Dr. Sarah Connor',
        email: 's.connor@school.edu',
        teacherId: 'TCH-102',
        department: 'Mathematics',
        specialization: 'Discrete Mathematics & Calculus',
        qualification: 'M.Sc., Ph.D. in Applied Mathematics',
        joiningDate: '2022-01-10'
      }
    ],
    classes: [
      {
        id: 'cls-01',
        name: 'Computer Science - Section A',
        code: 'CS-101-A',
        grade: 'Grade 11',
        section: 'A',
        teacherId: 'tch-01',
        teacherName: 'Prof. Marcus Brody',
        room: 'Lab 3B',
        studentCount: 28
      },
      {
        id: 'cls-02',
        name: 'Advanced Mathematics - Section A',
        code: 'MATH-201-A',
        grade: 'Grade 11',
        section: 'A',
        teacherId: 'tch-02',
        teacherName: 'Dr. Sarah Connor',
        room: 'Room 204',
        studentCount: 30
      },
      {
        id: 'cls-03',
        name: 'Physics Laboratory',
        code: 'PHY-301-B',
        grade: 'Grade 12',
        section: 'B',
        teacherId: 'tch-01',
        teacherName: 'Prof. Marcus Brody',
        room: 'Physics Lab 1',
        studentCount: 24
      }
    ],
    subjects: [
      { id: 'sub-01', name: 'Data Structures & Algorithms', code: 'CS-301', teacherName: 'Prof. Marcus Brody', credits: 4, classGrade: 'Grade 11' },
      { id: 'sub-02', name: 'Linear Algebra & Calculus', code: 'MTH-302', teacherName: 'Dr. Sarah Connor', credits: 4, classGrade: 'Grade 11' },
      { id: 'sub-03', name: 'Web Engineering & Database Design', code: 'CS-303', teacherName: 'Prof. Marcus Brody', credits: 3, classGrade: 'Grade 11' },
      { id: 'sub-04', name: 'Applied Physics & Electromagnetics', code: 'PHY-304', teacherName: 'Dr. Sarah Connor', credits: 4, classGrade: 'Grade 12' }
    ],
    attendance: [
      { id: 'att-01', studentId: 'std-01', studentName: 'Alex Rivera', classId: 'cls-01', date: '2026-09-14', status: 'Present', markedBy: 'Prof. Marcus Brody' },
      { id: 'att-02', studentId: 'std-02', studentName: 'Chloe Zhao', classId: 'cls-01', date: '2026-09-14', status: 'Present', markedBy: 'Prof. Marcus Brody' },
      { id: 'att-03', studentId: 'std-03', studentName: 'Liam Henderson', classId: 'cls-01', date: '2026-09-14', status: 'Late', markedBy: 'Prof. Marcus Brody' },
      { id: 'att-04', studentId: 'std-01', studentName: 'Alex Rivera', classId: 'cls-01', date: '2026-09-15', status: 'Present', markedBy: 'Prof. Marcus Brody' },
      { id: 'att-05', studentId: 'std-02', studentName: 'Chloe Zhao', classId: 'cls-01', date: '2026-09-15', status: 'Absent', markedBy: 'Prof. Marcus Brody' },
      { id: 'att-06', studentId: 'std-03', studentName: 'Liam Henderson', classId: 'cls-01', date: '2026-09-15', status: 'Present', markedBy: 'Prof. Marcus Brody' },
      { id: 'att-07', studentId: 'std-01', studentName: 'Alex Rivera', classId: 'cls-01', date: '2026-09-16', status: 'Present', markedBy: 'Prof. Marcus Brody' },
      { id: 'att-08', studentId: 'std-02', studentName: 'Chloe Zhao', classId: 'cls-01', date: '2026-09-16', status: 'Present', markedBy: 'Prof. Marcus Brody' },
      { id: 'att-09', studentId: 'std-03', studentName: 'Liam Henderson', classId: 'cls-01', date: '2026-09-16', status: 'Excused', markedBy: 'Prof. Marcus Brody' }
    ],
    assignments: [
      {
        id: 'asg-01',
        title: 'Binary Search Tree & Graph Traversal Implementation',
        subject: 'Data Structures & Algorithms',
        classGrade: 'Grade 11',
        teacherId: 'tch-01',
        teacherName: 'Prof. Marcus Brody',
        description: 'Implement BFS and DFS algorithms with cycle detection in TypeScript/Python. Include benchmark test cases and complexity analysis report.',
        dueDate: '2026-09-22',
        totalMarks: 50,
        submissionsCount: 19
      },
      {
        id: 'asg-02',
        title: 'Calculus Optimization & Vector Fields Problem Set',
        subject: 'Linear Algebra & Calculus',
        classGrade: 'Grade 11',
        teacherId: 'tch-02',
        teacherName: 'Dr. Sarah Connor',
        description: 'Complete problems 14 through 28 on Lagrange multipliers and curl/divergence theorems with step-by-step proofs.',
        dueDate: '2026-09-25',
        totalMarks: 40,
        submissionsCount: 22
      },
      {
        id: 'asg-03',
        title: 'Secure Full-Stack Authentication Architecture Blueprint',
        subject: 'Web Engineering & Database Design',
        classGrade: 'Grade 11',
        teacherId: 'tch-01',
        teacherName: 'Prof. Marcus Brody',
        description: 'Design a threat model diagram illustrating HttpOnly refresh cookie rotation, bcrypt 12 rounds hashing, and RBAC middleware filters.',
        dueDate: '2026-09-29',
        totalMarks: 100,
        submissionsCount: 14
      }
    ],
    examResults: [
      {
        id: 'res-01',
        studentId: 'std-01',
        studentName: 'Alex Rivera',
        examName: 'Mid-Term Examination 2026',
        subject: 'Data Structures & Algorithms',
        marksObtained: 94,
        totalMarks: 100,
        grade: 'A+',
        remarks: 'Outstanding algorithm design and code elegance.',
        date: '2026-08-28'
      },
      {
        id: 'res-02',
        studentId: 'std-01',
        studentName: 'Alex Rivera',
        examName: 'Mid-Term Examination 2026',
        subject: 'Linear Algebra & Calculus',
        marksObtained: 88,
        totalMarks: 100,
        grade: 'A',
        remarks: 'Excellent mastery of eigenvalue matrices.',
        date: '2026-08-30'
      },
      {
        id: 'res-03',
        studentId: 'std-02',
        studentName: 'Chloe Zhao',
        examName: 'Mid-Term Examination 2026',
        subject: 'Data Structures & Algorithms',
        marksObtained: 91,
        totalMarks: 100,
        grade: 'A',
        remarks: 'Superb problem solving.',
        date: '2026-08-28'
      },
      {
        id: 'res-04',
        studentId: 'std-03',
        studentName: 'Liam Henderson',
        examName: 'Mid-Term Examination 2026',
        subject: 'Data Structures & Algorithms',
        marksObtained: 82,
        totalMarks: 100,
        grade: 'B+',
        remarks: 'Good progress, review time complexity proofs.',
        date: '2026-08-28'
      }
    ],
    notices: [
      {
        id: 'ntc-01',
        title: 'Fall Semester Mid-Term Grade Reports Published',
        content: 'Official mid-term examination transcripts have been uploaded to all student and guardian portals. Any grade reconciliation requests must be submitted within 10 days.',
        category: 'Academic',
        postedBy: 'Dr. Eleanor Vance',
        postedRole: 'Dean of Academic Affairs',
        createdAt: '2026-09-10T09:00:00.000Z',
        isUrgent: false
      },
      {
        id: 'ntc-02',
        title: 'Campus Cyber Defense & Multi-Factor Security Mandatory Upgrade',
        content: 'In compliance with modern safety standards, all student and faculty accounts now require active JWT session validation and email OTP verification for off-campus logins.',
        category: 'Administrative',
        postedBy: 'IT Security Operations',
        postedRole: 'Systems Admin',
        createdAt: '2026-09-12T14:30:00.000Z',
        isUrgent: true
      },
      {
        id: 'ntc-03',
        title: 'Annual STEM Innovation & Hackathon 2026',
        content: 'Registration is now open for the 2026 Inter-School Hackathon. Teams of 3-4 students can register under their CS advisors before September 30.',
        category: 'Event',
        postedBy: 'Prof. Marcus Brody',
        postedRole: 'CS Department Lead',
        createdAt: '2026-09-15T11:15:00.000Z',
        isUrgent: false
      }
    ],
    otps: [],
    refreshTokens: [],
    auditLogs: [
      {
        id: 'log-01',
        action: 'SYSTEM_BOOT',
        userEmail: 'system@internal',
        role: 'system',
        ip: '127.0.0.1',
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        details: 'Security middleware (Helmet, RateLimiter, CORS, JWT-HttpOnly) active'
      }
    ]
  };
}

class Database {
  private data: DbSchema;

  constructor() {
    this.ensureDir();
    this.data = this.load();
  }

  private ensureDir() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private load(): DbSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading db.json, initializing fresh data', e);
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DbSchema) {
    try {
      this.ensureDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json', err);
    }
  }

  public get<K extends keyof DbSchema>(collection: K): DbSchema[K] {
    return this.data[collection];
  }

  public update<K extends keyof DbSchema>(collection: K, updater: (items: DbSchema[K]) => DbSchema[K]) {
    this.data[collection] = updater(this.data[collection]);
    this.save();
    return this.data[collection];
  }

  public resetToFactory() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }
}

export const db = new Database();
