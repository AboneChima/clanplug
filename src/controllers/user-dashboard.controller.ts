import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { userDashboardService } from '../services/user-dashboard.service';

export class UserDashboardController {
  async getDashboardStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;

      const stats = await userDashboardService.getUserDashboardStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get user dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getRecentActivity(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const activities = await userDashboardService.getUserRecentActivity(userId, limit);
      
      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Get user recent activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const userDashboardController = new UserDashboardController();