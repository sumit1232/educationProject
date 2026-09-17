import { Request, Response } from 'express';
import { db } from '../db';

export function getStudentDashboard(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    const students = db.get('students');
    const currentStudent = students.find((s) => s.userId === userId) || students[0]; // fallback to first student for demo view

    const allAttendance = db.get('attendance');
    const studentAttendance = allAttendance.filter((a) => a.studentId === currentStudent?.id);

    const totalDays = studentAttendance.length;
    const presentDays = studentAttendance.filter((a) => a.status === 'Present').length;
    const lateDays = studentAttendance.filter((a) => a.status === 'Late').length;
    const absentDays = studentAttendance.filter((a) => a.status === 'Absent').length;
    const excusedDays = studentAttendance.filter((a) => a.status === 'Excused').length;

    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 92;

    const assignments = db.get('assignments');
    const examResults = db.get('examResults').filter((r) => r.studentId === currentStudent?.id || r.studentName === currentStudent?.name);
    const notices = db.get('notices');
    const subjects = db.get('subjects');

    res.json({
      success: true,
      student: currentStudent,
      attendanceStats: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        excusedDays,
        attendanceRate,
        records: studentAttendance.slice(-10).reverse(),
      },
      assignments: assignments.slice(0, 10),
      examResults,
      notices: notices.slice(0, 6),
      subjects,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve student dashboard.' });
  }
}

export function submitAssignmentSolution(req: Request, res: Response) {
  try {
    const { assignmentId, solutionNotes, fileUrl } = req.body;
    if (!assignmentId) {
      res.status(400).json({ success: false, message: 'assignmentId is required.' });
      return;
    }

    db.update('assignments', (list) =>
      list.map((a) => (a.id === assignmentId ? { ...a, submissionsCount: (a.submissionsCount || 0) + 1 } : a))
    );

    res.json({
      success: true,
      message: 'Assignment solution submitted successfully for review!',
      submission: {
        assignmentId,
        submittedAt: new Date().toISOString(),
        fileUrl: fileUrl || 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        solutionNotes: solutionNotes || 'Assignment response submitted.',
        status: 'Submitted',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit assignment solution.' });
  }
}
