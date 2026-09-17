import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, UserDoc, StudentDoc, TeacherDoc, ClassDoc, SubjectDoc, NoticeDoc } from '../db';

export function getAdminStats(req: Request, res: Response) {
  try {
    const users = db.get('users');
    const students = db.get('students');
    const teachers = db.get('teachers');
    const classes = db.get('classes');
    const attendance = db.get('attendance');
    const notices = db.get('notices');
    const auditLogs = db.get('auditLogs');
    const activeSessions = db.get('refreshTokens').filter((t) => t.expiresAt > Date.now());

    // Calculate attendance percentage
    const presentCount = attendance.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;

    res.json({
      success: true,
      stats: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalUsers: users.length,
        attendanceRate,
        activeNotices: notices.length,
        activeSessionsCount: activeSessions.length,
        securityEventsCount: auditLogs.length,
        systemSecurity: {
          rateLimiting: 'ACTIVE (express-rate-limit)',
          httpOnlyCookies: 'ACTIVE (Strict JWT)',
          bcryptSaltRounds: 12,
          rbacEnforced: 'ACTIVE',
          headersProtected: 'Helmet v8',
          injectionFilter: 'ACTIVE (NoSQL/Mongoose Sanitize)',
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
}

export function getAllUsers(req: Request, res: Response) {
  try {
    const users = db.get('users');
    const safeUsers = users.map(({ passwordHash, ...safe }) => safe);
    res.json({ success: true, users: safeUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
}

export function updateUserRole(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'teacher', 'student'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role provided.' });
      return;
    }

    let updatedUser: any = null;
    db.update('users', (list) =>
      list.map((u) => {
        if (u.id === userId) {
          updatedUser = { ...u, role };
          return updatedUser;
        }
        return u;
      })
    );

    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    db.update('auditLogs', (logs) => [
      {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        action: 'USER_ROLE_CHANGED',
        userEmail: req.user?.email || 'admin',
        role: req.user?.role || 'admin',
        ip: req.ip || 'internal',
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        details: `Changed role of user ${updatedUser.email} to ${role}`,
      },
      ...logs.slice(0, 99),
    ]);

    res.json({ success: true, message: `User role updated to ${role}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
}

export function deleteUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    // Prevent deleting own account
    if (req.user?.userId === userId) {
      res.status(400).json({ success: false, message: 'Cannot delete your own active administrative account.' });
      return;
    }

    db.update('users', (list) => list.filter((u) => u.id !== userId));
    db.update('students', (list) => list.filter((s) => s.userId !== userId));
    db.update('teachers', (list) => list.filter((t) => t.userId !== userId));
    db.update('refreshTokens', (list) => list.filter((t) => t.userId !== userId));

    res.json({ success: true, message: 'User and associated records removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}

export function getStudents(req: Request, res: Response) {
  res.json({ success: true, students: db.get('students') });
}

export async function createStudent(req: Request, res: Response) {
  try {
    const { name, email, grade, section, guardianName, guardianPhone } = req.body;
    if (!name || !email || !grade) {
      res.status(400).json({ success: false, message: 'Name, email, and grade are required.' });
      return;
    }

    const studentId = `STU-2026-${Math.floor(100 + Math.random() * 900)}`;
    const passHash = await bcrypt.hash('Student123!', 12);
    const userId = `usr-student-${crypto.randomUUID().slice(0, 8)}`;

    const userDoc: UserDoc = {
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash: passHash,
      role: 'student',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      isVerified: true,
      phone: guardianPhone || '',
      createdAt: new Date().toISOString(),
      department: `${grade} - Section ${section || 'A'}`,
      studentId,
    };

    const studentDoc: StudentDoc = {
      id: `std-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      name,
      email: email.toLowerCase(),
      studentId,
      grade,
      section: section || 'A',
      guardianName: guardianName || 'Guardian',
      guardianPhone: guardianPhone || '+1 (555) 000-0000',
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    db.update('users', (list) => [...list, userDoc]);
    db.update('students', (list) => [...list, studentDoc]);

    res.status(201).json({ success: true, student: studentDoc, message: 'Student created successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create student.' });
  }
}

export function getTeachers(req: Request, res: Response) {
  res.json({ success: true, teachers: db.get('teachers') });
}

export async function createTeacher(req: Request, res: Response) {
  try {
    const { name, email, department, specialization, qualification } = req.body;
    if (!name || !email || !department) {
      res.status(400).json({ success: false, message: 'Name, email, and department are required.' });
      return;
    }

    const teacherId = `TCH-${Math.floor(100 + Math.random() * 900)}`;
    const passHash = await bcrypt.hash('Teacher123!', 12);
    const userId = `usr-teacher-${crypto.randomUUID().slice(0, 8)}`;

    const userDoc: UserDoc = {
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash: passHash,
      role: 'teacher',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      isVerified: true,
      createdAt: new Date().toISOString(),
      department,
      teacherId,
    };

    const teacherDoc: TeacherDoc = {
      id: `tch-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      name,
      email: email.toLowerCase(),
      teacherId,
      department,
      specialization: specialization || 'General Academics',
      qualification: qualification || 'M.Sc.',
      joiningDate: new Date().toISOString().split('T')[0],
    };

    db.update('users', (list) => [...list, userDoc]);
    db.update('teachers', (list) => [...list, teacherDoc]);

    res.status(201).json({ success: true, teacher: teacherDoc, message: 'Teacher created successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create teacher.' });
  }
}

export function getClasses(req: Request, res: Response) {
  res.json({ success: true, classes: db.get('classes') });
}

export function createClass(req: Request, res: Response) {
  try {
    const { name, code, grade, section, teacherName, room } = req.body;
    const newClass: ClassDoc = {
      id: `cls-${crypto.randomUUID().slice(0, 8)}`,
      name,
      code: code || `CLS-${Math.floor(100 + Math.random() * 900)}`,
      grade: grade || 'Grade 11',
      section: section || 'A',
      teacherId: 'tch-01',
      teacherName: teacherName || 'Prof. Marcus Brody',
      room: room || 'Room 101',
      studentCount: 25,
    };
    db.update('classes', (list) => [...list, newClass]);
    res.status(201).json({ success: true, class: newClass, message: 'Class added successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create class.' });
  }
}

export function getAuditLogs(req: Request, res: Response) {
  res.json({ success: true, logs: db.get('auditLogs') });
}

export function getNotices(req: Request, res: Response) {
  res.json({ success: true, notices: db.get('notices') });
}

export function createNotice(req: Request, res: Response) {
  try {
    const { title, content, category, isUrgent } = req.body;
    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Notice title and content are required.' });
      return;
    }

    const newNotice: NoticeDoc = {
      id: `ntc-${crypto.randomUUID().slice(0, 8)}`,
      title,
      content,
      category: category || 'Academic',
      postedBy: req.user?.name || 'Administrator',
      postedRole: req.user?.role || 'admin',
      createdAt: new Date().toISOString(),
      isUrgent: Boolean(isUrgent),
    };

    db.update('notices', (list) => [newNotice, ...list]);
    res.status(201).json({ success: true, notice: newNotice, message: 'Notice broadcasted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create notice.' });
  }
}

export function resetDatabaseToDemo(req: Request, res: Response) {
  try {
    db.resetToFactory();
    res.json({ success: true, message: 'System database restored to factory demo state!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset database.' });
  }
}
