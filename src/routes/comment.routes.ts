import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation middleware
const createCommentValidation = [
  param('postId').isUUID().withMessage('Invalid post ID'),
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Invalid parent comment ID'),
];

const updateCommentValidation = [
  param('commentId').isUUID().withMessage('Invalid comment ID'),
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content must be between 1 and 1000 characters'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Comment routes
router.post(
  '/posts/:postId/comments',
  authenticate,
  createCommentValidation,
  validateRequest,
  asyncHandler(commentController.createComment)
);

router.get(
  '/posts/:postId/comments',
  optionalAuthenticate,
  [
    param('postId').isUUID().withMessage('Invalid post ID'),
    ...paginationValidation,
  ],
  validateRequest,
  asyncHandler(commentController.getPostComments)
);

router.get(
  '/comments/:commentId/replies',
  optionalAuthenticate,
  [
    param('commentId').isUUID().withMessage('Invalid comment ID'),
    ...paginationValidation,
  ],
  validateRequest,
  asyncHandler(commentController.getCommentReplies)
);

router.get(
  '/comments/:commentId',
  optionalAuthenticate,
  [param('commentId').isUUID().withMessage('Invalid comment ID')],
  validateRequest,
  commentController.getCommentById
);

router.put(
  '/comments/:commentId',
  authenticate,
  updateCommentValidation,
  validateRequest,
  asyncHandler(commentController.updateComment)
);

router.delete(
  '/comments/:commentId',
  authenticate,
  [param('commentId').isUUID().withMessage('Invalid comment ID')],
  validateRequest,
  asyncHandler(commentController.deleteComment)
);

router.get(
  '/users/:userId/comments',
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    ...paginationValidation,
  ],
  validateRequest,
  commentController.getUserComments
);

export default router;