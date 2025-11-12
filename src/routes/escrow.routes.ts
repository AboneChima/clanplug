import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireKYC } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { escrowService } from '../services/escrow.service';
import { escrowMessageController } from '../controllers/escrowMessage.controller';
import { body, param, query, validationResult } from 'express-validator';
import { Currency } from '@prisma/client';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};

// POST /api/escrow - Create new escrow transaction
router.post('/', 
  authenticate, 
  requireKYC,
  [
    body('sellerId').notEmpty().withMessage('Seller ID is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('currency').isIn(['NGN', 'USD', 'LMC']).withMessage('Currency must be NGN, USD, or LMC'),
    body('title').isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description').isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('postId').optional().isString(),
    body('terms').optional().isString(),
    body('autoReleaseHours').optional().isInt({ min: 1, max: 720 }).withMessage('Auto release hours must be between 1 and 720 (30 days)'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { sellerId, postId, amount, currency, title, description, terms, autoReleaseHours } = req.body;
    const buyerId = req.user!.id;

    const result = await escrowService.createEscrow({
      buyerId,
      sellerId,
      postId,
      amount: parseFloat(amount),
      currency: currency as Currency,
      title,
      description,
      terms,
      autoReleaseHours: autoReleaseHours ? parseInt(autoReleaseHours) : undefined
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.escrow,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  })
);

// GET /api/escrow - Get user escrow transactions
router.get('/', 
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await escrowService.getUserEscrows(userId, page, limit);
    
    res.json({
      success: true,
      message: 'Escrows retrieved successfully',
      data: result.escrows,
      pagination: result.pagination,
    });
  })
);

// GET /api/escrow/:escrowId - Get escrow details
router.get('/:escrowId', 
  authenticate,
  param('escrowId').notEmpty().withMessage('Escrow ID is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { escrowId } = req.params;
    const userId = req.user!.id;

    try {
      const escrow = await escrowService.getEscrowById(escrowId, userId);
      
      res.json({
        success: true,
        message: 'Escrow retrieved successfully',
        data: escrow,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Escrow not found',
      });
    }
  })
);

// POST /api/escrow/:escrowId/accept - Accept escrow (seller)
router.post('/:escrowId/accept', 
  authenticate, 
  requireKYC,
  param('escrowId').notEmpty().withMessage('Escrow ID is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { escrowId } = req.params;
    const sellerId = req.user!.id;

    const result = await escrowService.acceptEscrow(escrowId, sellerId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.escrow,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  })
);

// POST /api/escrow/:escrowId/reject - Reject escrow (seller)
router.post('/:escrowId/reject', 
  authenticate, 
  requireKYC,
  [
    param('escrowId').notEmpty().withMessage('Escrow ID is required'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { escrowId } = req.params;
    const { reason } = req.body;
    const sellerId = req.user!.id;

    const result = await escrowService.rejectEscrow(escrowId, sellerId, reason);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.escrow,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  })
);

// POST /api/escrow/:escrowId/fund - Fund escrow (buyer)
router.post('/:escrowId/fund', 
  authenticate, 
  requireKYC,
  param('escrowId').notEmpty().withMessage('Escrow ID is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { escrowId } = req.params;
    const buyerId = req.user!.id;

    const result = await escrowService.fundEscrow(escrowId, buyerId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.escrow,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  })
);

// POST /api/escrow/:escrowId/deliver - Mark as delivered (seller)
router.post('/:escrowId/deliver', 
  authenticate, 
  requireKYC,
  [
    param('escrowId').notEmpty().withMessage('Escrow ID is required'),
    body('deliveryNotes').optional().isString().withMessage('Delivery notes must be a string'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { escrowId } = req.params;
    const { deliveryNotes } = req.body;
    const sellerId = req.user!.id;

    const result = await escrowService.markAsDelivered(escrowId, sellerId, deliveryNotes);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.escrow,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  })
);

// POST /api/escrow/:escrowId/confirm - Confirm delivery (buyer)
router.post('/:escrowId/confirm', 
  authenticate, 
  requireKYC,
  param('escrowId').notEmpty().withMessage('Escrow ID is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { escrowId } = req.params;
    const buyerId = req.user!.id;

    const result = await escrowService.confirmDelivery(escrowId, buyerId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.escrow,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  })
);

// POST /api/escrow/:escrowId/dispute - Create dispute
router.post('/:escrowId/dispute', 
  authenticate, 
  requireKYC,
  [
    param('escrowId').notEmpty().withMessage('Escrow ID is required'),
    body('reason').isLength({ min: 10, max: 500 }).withMessage('Dispute reason must be between 10 and 500 characters'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { escrowId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    const result = await escrowService.createDispute(escrowId, userId, reason);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.escrow,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  })
);

// POST /api/escrow/:escrowId/cancel - Cancel escrow
router.post('/:escrowId/cancel', 
  authenticate,
  param('escrowId').notEmpty().withMessage('Escrow ID is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { escrowId } = req.params;
    const userId = req.user!.id;

    const result = await escrowService.cancelEscrow(escrowId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.escrow,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  })
);

// GET /api/escrow/:escrowId/messages - Get escrow messages
router.get('/:escrowId/messages', 
  authenticate,
  [
    param('escrowId').notEmpty().withMessage('Escrow ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  asyncHandler(escrowMessageController.getMessages.bind(escrowMessageController))
);

// POST /api/escrow/:escrowId/messages - Send escrow message
router.post('/:escrowId/messages', 
  authenticate, 
  requireKYC,
  [
    param('escrowId').notEmpty().withMessage('Escrow ID is required'),
    body('message').isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array'),
  ],
  handleValidationErrors,
  asyncHandler(escrowMessageController.sendMessage.bind(escrowMessageController))
);

// GET /api/escrow/:escrowId/messages/unread-count - Get unread message count
router.get('/:escrowId/messages/unread-count', 
  authenticate,
  param('escrowId').notEmpty().withMessage('Escrow ID is required'),
  handleValidationErrors,
  asyncHandler(escrowMessageController.getUnreadCount.bind(escrowMessageController))
);

// PUT /api/escrow/:escrowId/messages/read - Mark messages as read
router.put('/:escrowId/messages/read', 
  authenticate,
  param('escrowId').notEmpty().withMessage('Escrow ID is required'),
  handleValidationErrors,
  asyncHandler(escrowMessageController.markAsRead.bind(escrowMessageController))
);

// PUT /api/escrow/:escrowId/extend - Extend escrow deadline
router.put('/:escrowId/extend', 
  authenticate, 
  requireKYC,
  [
    param('escrowId').notEmpty().withMessage('Escrow ID is required'),
    body('additionalHours').isInt({ min: 1, max: 168 }).withMessage('Additional hours must be between 1 and 168 (7 days)'),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const { escrowId } = req.params;
    const { additionalHours } = req.body;
    const userId = req.user!.id;

    const result = await escrowService.extendDeadline(escrowId, userId, parseInt(additionalHours));

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.escrow,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  })
);

export default router;