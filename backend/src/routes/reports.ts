import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as reportController from '../controllers/reportController';

const router = Router();

router.use(authenticate);

router.get('/scan/:scanId', reportController.getScanReports);
router.post('/scan/:scanId/generate', reportController.generateReport);

export default router;






