import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/status', verificationController.getStatus);
router.post('/purchase', verificationController.purchase);
router.post('/renew', verificationController.renew);
router.post('/manual-verify', verificationController.manualVerify); // No auth needed, uses secret

export default router;
