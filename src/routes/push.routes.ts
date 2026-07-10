import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { pushController } from '../controllers/push.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/push/subscribe - Subscribe to push notifications
router.post('/subscribe', asyncHandler(pushController.subscribe.bind(pushController)));

// POST /api/push/unsubscribe - Unsubscribe from push notifications
router.post('/unsubscribe', asyncHandler(pushController.unsubscribe.bind(pushController)));

// POST /api/push/test - Send test notification
router.post('/test', asyncHandler(pushController.sendTest.bind(pushController)));

export default router;
