import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { userDashboardController } from '../controllers/user-dashboard.controller';

const router = Router();

// GET /api/user/dashboard - Get user dashboard statistics
router.get('/dashboard', 
  authenticate, 
  asyncHandler(userDashboardController.getDashboardStats.bind(userDashboardController))
);

// GET /api/user/activity - Get user recent activity
router.get('/activity', 
  authenticate, 
  asyncHandler(userDashboardController.getRecentActivity.bind(userDashboardController))
);

export default router;