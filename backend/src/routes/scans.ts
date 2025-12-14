import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as scanController from '../controllers/scanController';

const router = Router();

router.use(authenticate);

router.get('/', scanController.getScans);
router.post('/', scanController.createScan);
router.get('/:id', scanController.getScan);
router.post('/:id/cancel', scanController.cancelScan);
router.get('/:id/status', scanController.getScanStatus);

export default router;






