import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Manual verify endpoint - no auth required (uses secret instead)
router.post('/manual-verify', verificationController.manualVerify);

// All other routes require authentication
router.use(authenticate);

router.get('/status', verificationController.getStatus);
router.post('/purchase', verificationController.purchase);
router.post('/renew', verificationController.renew);

export default router;
