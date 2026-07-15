import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { communityController } from '../controllers/community.controller';
import { body, param } from 'express-validator';

const router = Router();

// GET /api/communities/discover - Browse all communities
router.get('/discover',
  authenticate,
  asyncHandler(communityController.getDiscoverCommunities)
);

// GET /api/communities/my-communities - Get joined communities
router.get('/my-communities',
  authenticate,
  asyncHandler(communityController.getMyCommunities)
);

// GET /api/communities/:id - Get community details
router.get('/:id',
  authenticate,
  param('id').notEmpty(),
  asyncHandler(communityController.getCommunityDetails)
);

// POST /api/communities/:id/join - Join community
router.post('/:id/join',
  authenticate,
  param('id').notEmpty(),
  asyncHandler(communityController.joinCommunity)
);

// POST /api/communities/:id/leave - Leave community
router.post('/:id/leave',
  authenticate,
  param('id').notEmpty(),
  asyncHandler(communityController.leaveCommunity)
);

// GET /api/communities/:id/messages - Get community messages
router.get('/:id/messages',
  authenticate,
  param('id').notEmpty(),
  asyncHandler(communityController.getCommunityMessages)
);

// POST /api/communities/:id/messages - Send message
router.post('/:id/messages',
  authenticate,
  [
    param('id').notEmpty(),
    body('content').isLength({ min: 1, max: 2000 }),
    body('type').optional().isIn(['TEXT', 'IMAGE', 'SYSTEM']),
    body('attachments').optional().isArray(),
    body('replyToId').optional().isString(),
  ],
  asyncHandler(communityController.sendCommunityMessage)
);

// PUT /api/communities/:id/read - Mark as read
router.put('/:id/read',
  authenticate,
  param('id').notEmpty(),
  asyncHandler(communityController.markAsRead)
);

export default router;
