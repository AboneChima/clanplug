import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/status', verificationController.getStatus);
router.post('/purchase', verificationController.purchase);
router.post('/renew', verificationController.renew);

export default router;
