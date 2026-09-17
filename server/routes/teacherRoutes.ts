import { Router } from 'express';
import {
  getTeacherClasses,
  getAttendance,
  markBatchAttendance,
  getAssignments,
  createAssignment,
  deleteAssignment,
  submitExamGrade,
} from '../controllers/teacherController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

// Accessible by both teachers and administrators
router.use(authenticate);
router.use(authorizeRoles('teacher', 'admin'));

router.get('/classes', getTeacherClasses);
router.get('/attendance', getAttendance);
router.post('/attendance', markBatchAttendance);

router.get('/assignments', getAssignments);
router.post('/assignments', createAssignment);
router.delete('/assignments/:id', deleteAssignment);

router.post('/grades', submitExamGrade);

export default router;
