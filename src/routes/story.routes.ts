import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { storyController } from '../controllers/story.controller';
import { body, param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/stories - Create a new story
router.post(
  '/',
  [
    body('media').notEmpty().withMessage('Media URL is required'),
    body('mediaType').isIn(['image', 'video']).withMessage('Media type must be image or video'),
    body('caption').optional().isString(),
  ],
  asyncHandler(storyController.createStory.bind(storyController))
);

// GET /api/stories - Get all active stories
router.get('/', asyncHandler(storyController.getStories.bind(storyController)));

// POST /api/stories/:storyId/view - Mark story as viewed
router.post(
  '/:storyId/view',
  param('storyId').notEmpty().withMessage('Story ID is required'),
  asyncHandler(storyController.viewStory.bind(storyController))
);

// DELETE /api/stories/:storyId - Delete a story
router.delete(
  '/:storyId',
  param('storyId').notEmpty().withMessage('Story ID is required'),
  asyncHandler(storyController.deleteStory.bind(storyController))
);

// GET /api/stories/:storyId/viewers - Get story viewers
router.get(
  '/:storyId/viewers',
  param('storyId').notEmpty().withMessage('Story ID is required'),
  asyncHandler(storyController.getViewers.bind(storyController))
);

export default router;
