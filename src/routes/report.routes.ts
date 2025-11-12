import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { reportController } from '../controllers/report.controller';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/reports/user/:userId - Report a user
router.post('/user/:userId', 
  authenticate,
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    body('reason').notEmpty().trim().isLength({ min: 1, max: 100 }).withMessage('Reason is required and must be 1-100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be 500 characters or less')
  ],
  handleValidationErrors,
  asyncHandler(reportController.reportUser)
);

// GET /api/reports/my - Get current user's reports
router.get('/my',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'status']).withMessage('Invalid sortBy parameter'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sortOrder parameter')
  ],
  handleValidationErrors,
  asyncHandler(reportController.getUserReports)
);

// Admin routes (these require admin role middleware)
// GET /api/reports - Get all reports (Admin only)
router.get('/',
  authenticate,
  adminOnly,
  [
    query('status').optional().isIn(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']).withMessage('Invalid status'),
    query('reason').optional().isString().withMessage('Reason must be a string'),
    query('reportedUserId').optional().isUUID().withMessage('Invalid reported user ID'),
    query('postId').optional().isUUID().withMessage('Invalid post ID'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'status']).withMessage('Invalid sortBy parameter'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sortOrder parameter')
  ],
  handleValidationErrors,
  asyncHandler(reportController.getReports)
);

// GET /api/reports/stats - Get report statistics (Admin only)
router.get('/stats',
  authenticate,
  adminOnly,
  asyncHandler(reportController.getReportStats)
);

// GET /api/reports/:reportId - Get report by ID (Admin only)
router.get('/:reportId',
  authenticate,
  adminOnly,
  [
    param('reportId').isUUID().withMessage('Invalid report ID')
  ],
  handleValidationErrors,
  asyncHandler(reportController.getReportById)
);

// PUT /api/reports/:reportId/status - Update report status (Admin only)
router.put('/:reportId/status',
  authenticate,
  adminOnly,
  [
    param('reportId').isUUID().withMessage('Invalid report ID'),
    body('status').isIn(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']).withMessage('Invalid status'),
    body('adminNotes').optional().isLength({ max: 1000 }).withMessage('Admin notes must be 1000 characters or less')
  ],
  handleValidationErrors,
  asyncHandler(reportController.updateReportStatus)
);

export default router;