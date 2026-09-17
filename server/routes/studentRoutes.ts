import { Router } from 'express';
import { getStudentDashboard, submitAssignmentSolution } from '../controllers/studentController';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';

const router = Router();

// Accessible by student and administrative roles
router.use(authenticate);
router.use(authorizeRoles('student', 'admin', 'teacher'));

router.get('/dashboard', getStudentDashboard);
router.post('/assignments/submit', submitAssignmentSolution);

export default router;
