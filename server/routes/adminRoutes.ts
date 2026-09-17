import { Router } from 'express';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getStudents,
  createStudent,
  getTeachers,
  createTeacher,
  getClasses,
  createClass,
  getAuditLogs,
  getNotices,
  createNotice,
  resetDatabaseToDemo,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

// Protect all admin routes with JWT authentication & Admin role check
router.use(authenticate);
router.use(authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

router.get('/students', getStudents);
router.post('/students', createStudent);

router.get('/teachers', getTeachers);
router.post('/teachers', createTeacher);

router.get('/classes', getClasses);
router.post('/classes', createClass);

router.get('/audit-logs', getAuditLogs);
router.get('/notices', getNotices);
router.post('/notices', createNotice);

router.post('/reset-database', resetDatabaseToDemo);

export default router;
