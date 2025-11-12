import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { followController } from '../controllers/follow.controller';
import { param, query } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/follow/suggested - Get suggested users to follow (MUST BE FIRST)
router.get(
  '/suggested',
  query('limit').optional().isInt({ min: 1, max: 50 }),
  asyncHandler(followController.getSuggestedUsers.bind(followController))
);

// POST /api/follow/:userId - Follow a user
router.post(
  '/:userId',
  param('userId').notEmpty().withMessage('User ID is required'),
  asyncHandler(followController.followUser.bind(followController))
);

// DELETE /api/follow/:userId - Unfollow a user
router.delete(
  '/:userId',
  param('userId').notEmpty().withMessage('User ID is required'),
  asyncHandler(followController.unfollowUser.bind(followController))
);

// GET /api/follow/:userId/followers - Get user's followers
router.get(
  '/:userId/followers',
  [
    param('userId').notEmpty().withMessage('User ID is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  asyncHandler(followController.getFollowers.bind(followController))
);

// GET /api/follow/:userId/following - Get users that user is following
router.get(
  '/:userId/following',
  [
    param('userId').notEmpty().withMessage('User ID is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  asyncHandler(followController.getFollowing.bind(followController))
);

// GET /api/follow/:userId/check - Check if following a user
router.get(
  '/:userId/check',
  param('userId').notEmpty().withMessage('User ID is required'),
  asyncHandler(followController.checkFollowing.bind(followController))
);

// GET /api/follow/:userId/stats - Get follow stats
router.get(
  '/:userId/stats',
  param('userId').notEmpty().withMessage('User ID is required'),
  asyncHandler(followController.getFollowStats.bind(followController))
);

export default router;
