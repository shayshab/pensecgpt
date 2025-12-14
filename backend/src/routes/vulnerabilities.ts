import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as vulnerabilityController from '../controllers/vulnerabilityController';

const router = Router();

router.use(authenticate);

router.get('/', vulnerabilityController.getVulnerabilities);
router.get('/:id', vulnerabilityController.getVulnerability);
router.put('/:id', vulnerabilityController.updateVulnerability);
router.get('/project/:projectId', vulnerabilityController.getProjectVulnerabilities);

export default router;






