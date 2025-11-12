import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { followService } from '../services/follow.service';

export class FollowController {
  // Follow a user
  async followUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followerId = req.user!.id;
      const { userId } = req.params;

      const result = await followService.followUser(followerId, userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to follow user',
      });
    }
  }

  // Unfollow a user
  async unfollowUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followerId = req.user!.id;
      const { userId } = req.params;

      const result = await followService.unfollowUser(followerId, userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unfollow user',
      });
    }
  }

  // Get followers
  async getFollowers(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await followService.getFollowers(userId, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching followers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch followers',
      });
    }
  }

  // Get following
  async getFollowing(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await followService.getFollowing(userId, page, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching following:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch following',
      });
    }
  }

  // Check if following
  async checkFollowing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followerId = req.user!.id;
      const { userId } = req.params;

      const result = await followService.isFollowing(followerId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check follow status',
      });
    }
  }

  // Get suggested users
  async getSuggestedUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await followService.getSuggestedUsers(userId, limit);
      res.json(result);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch suggested users',
      });
    }
  }

  // Get follow stats
  async getFollowStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await followService.getFollowStats(userId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching follow stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stats',
      });
    }
  }
}

export const followController = new FollowController();
