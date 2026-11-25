import express from 'express';
import { businessOpsController } from '../controllers/businessOpsController.js';
import { requireAuth } from '../middleware/auth.js';
import { hasRole } from '../middleware/rbac.js';

const router = express.Router();
const managers = hasRole('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'AGENT_ADMIN', 'MANAGER', 'CEO', 'CTO', 'IT_ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT', 'HR_MANAGER');

router.use(requireAuth);
router.get('/summary', managers, businessOpsController.summary);
router.get('/:module', managers, businessOpsController.list);
router.post('/:module', managers, businessOpsController.create);
router.patch('/:module/:id', managers, businessOpsController.update);

export default router;
