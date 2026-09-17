import { Request, Response } from 'express';
import crypto from 'crypto';
import { db, AttendanceRecord, AssignmentDoc, ExamResultDoc } from '../db';

export function getTeacherClasses(req: Request, res: Response) {
  try {
    const classes = db.get('classes');
    res.json({ success: true, classes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve classes.' });
  }
}

export function getAttendance(req: Request, res: Response) {
  try {
    const { classId, date } = req.query;
    let records = db.get('attendance');
    if (classId) {
      records = records.filter((r) => r.classId === classId);
    }
    if (date) {
      records = records.filter((r) => r.date === date);
    }
    res.json({ success: true, attendance: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve attendance.' });
  }
}

export function markBatchAttendance(req: Request, res: Response) {
  try {
    const { classId, date, records } = req.body;
    if (!classId || !date || !Array.isArray(records)) {
      res.status(400).json({ success: false, message: 'classId, date, and records array are required.' });
      return;
    }

    const currentAttendance = db.get('attendance');
    // Remove existing records for this class on this date to overwrite
    const filtered = currentAttendance.filter((r) => !(r.classId === classId && r.date === date));

    const newEntries: AttendanceRecord[] = records.map((rec: any) => ({
      id: `att-${crypto.randomUUID().slice(0, 8)}`,
      studentId: rec.studentId,
      studentName: rec.studentName,
      classId,
      date,
      status: rec.status,
      markedBy: req.user?.name || 'Faculty Member',
    }));

    db.update('attendance', () => [...filtered, ...newEntries]);

    res.json({ success: true, message: `Attendance saved for ${newEntries.length} students!`, entries: newEntries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark attendance.' });
  }
}

export function getAssignments(req: Request, res: Response) {
  try {
    const assignments = db.get('assignments');
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch assignments.' });
  }
}

export function createAssignment(req: Request, res: Response) {
  try {
    const { title, subject, classGrade, description, dueDate, totalMarks, attachmentUrl } = req.body;
    if (!title || !subject || !dueDate) {
      res.status(400).json({ success: false, message: 'Title, subject, and dueDate are required.' });
      return;
    }

    const newAssignment: AssignmentDoc = {
      id: `asg-${crypto.randomUUID().slice(0, 8)}`,
      title,
      subject,
      classGrade: classGrade || 'Grade 11',
      teacherId: req.user?.userId || 'tch-01',
      teacherName: req.user?.name || 'Faculty Instructor',
      description: description || '',
      dueDate,
      totalMarks: Number(totalMarks) || 100,
      submissionsCount: 0,
      attachmentUrl: attachmentUrl || undefined,
    };

    db.update('assignments', (list) => [newAssignment, ...list]);
    res.status(201).json({ success: true, assignment: newAssignment, message: 'Assignment published successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create assignment.' });
  }
}

export function deleteAssignment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    db.update('assignments', (list) => list.filter((a) => a.id !== id));
    res.json({ success: true, message: 'Assignment removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete assignment.' });
  }
}

export function submitExamGrade(req: Request, res: Response) {
  try {
    const { studentId, studentName, examName, subject, marksObtained, totalMarks, remarks } = req.body;
    if (!studentId || !examName || !subject || marksObtained === undefined) {
      res.status(400).json({ success: false, message: 'studentId, examName, subject, and marks are required.' });
      return;
    }

    const marks = Number(marksObtained);
    const total = Number(totalMarks) || 100;
    const percentage = (marks / total) * 100;

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else grade = 'D';

    const newResult: ExamResultDoc = {
      id: `res-${crypto.randomUUID().slice(0, 8)}`,
      studentId,
      studentName: studentName || 'Student',
      examName,
      subject,
      marksObtained: marks,
      totalMarks: total,
      grade,
      remarks: remarks || 'Academic performance recorded.',
      date: new Date().toISOString().split('T')[0],
    };

    db.update('examResults', (list) => [newResult, ...list]);
    res.status(201).json({ success: true, result: newResult, message: 'Exam grade recorded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to record grade.' });
  }
}
