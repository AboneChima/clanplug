import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { purchaseRequestService } from '../services/purchaseRequest.service';
import { registerFCMToken, unregisterFCMToken } from '../services/firebase.service';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// POST /api/purchase-requests - Create purchase request
router.post('/',
  authenticate,
  [
    body('sellerId').notEmpty().withMessage('Seller ID is required'),
    body('postId').notEmpty().withMessage('Post ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('currency').isIn(['NGN', 'USD']).withMessage('Invalid currency')
  ],
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
      return;
    }

    const { sellerId, postId, amount, currency } = req.body;
    const buyerId = req.user!.id;

    const request = await purchaseRequestService.create(
      buyerId,
      sellerId,
      postId,
      parseFloat(amount),
      currency
    );

    res.json({
      success: true,
      message: 'Purchase request sent! Seller has 5 minutes to respond.',
      data: request
    });
  })
);

// POST /api/purchase-requests/:id/accept - Seller accepts
router.post('/:id/accept',
  authenticate,
  param('id').notEmpty(),
  asyncHandler(async (req: Request, res: Response) => {
    const sellerId = req.user!.id;
    const requestId = req.params.id;

    const request = await purchaseRequestService.accept(requestId, sellerId);

    res.json({
      success: true,
      message: 'Request accepted! Buyer has been notified.',
      data: request
    });
  })
);

// POST /api/purchase-requests/:id/reject - Seller rejects
router.post('/:id/reject',
  authenticate,
  [
    param('id').notEmpty(),
    body('reason').optional().isString()
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const sellerId = req.user!.id;
    const requestId = req.params.id;
    const { reason } = req.body;

    const request = await purchaseRequestService.reject(requestId, sellerId, reason);

    res.json({
      success: true,
      message: 'Request rejected.',
      data: request
    });
  })
);

// POST /api/purchase-requests/:id/cancel - Buyer cancels
router.post('/:id/cancel',
  authenticate,
  param('id').notEmpty(),
  asyncHandler(async (req: Request, res: Response) => {
    const buyerId = req.user!.id;
    const requestId = req.params.id;

    const request = await purchaseRequestService.cancel(requestId, buyerId);

    res.json({
      success: true,
      message: 'Request cancelled.',
      data: request
    });
  })
);

// GET /api/purchase-requests - Get user's requests
router.get('/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const requests = await purchaseRequestService.getUserRequests(userId);

    res.json({
      success: true,
      data: requests
    });
  })
);

// GET /api/purchase-requests/:id - Get specific request
router.get('/:id',
  authenticate,
  param('id').notEmpty(),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const requestId = req.params.id;

    const { prisma } = await import('../config/database');
    
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            currency: true,
            images: true,
            status: true
          }
        }
      }
    });

    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Request not found'
      });
      return;
    }

    // Check authorization
    if (request.buyerId !== userId && request.sellerId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    res.json({
      success: true,
      data: request
    });
  })
);

// POST /api/purchase-requests/fcm/register - Register FCM token
router.post('/fcm/register',
  authenticate,
  body('token').notEmpty(),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { token } = req.body;

    await registerFCMToken(userId, token);

    res.json({
      success: true,
      message: 'FCM token registered'
    });
  })
);

// POST /api/purchase-requests/fcm/unregister - Unregister FCM token
router.post('/fcm/unregister',
  authenticate,
  body('token').notEmpty(),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { token } = req.body;

    await unregisterFCMToken(userId, token);

    res.json({
      success: true,
      message: 'FCM token unregistered'
    });
  })
);

// POST /api/purchase-requests/:id/link-escrow - Link escrow to purchase request
router.post('/:id/link-escrow',
  authenticate,
  [
    param('id').notEmpty().withMessage('Request ID is required'),
    body('escrowId').notEmpty().withMessage('Escrow ID is required')
  ],
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const { escrowId } = req.body;
    const userId = req.user!.id;

    const result = await purchaseRequestService.linkEscrow(id, escrowId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Escrow linked successfully',
        data: result.request
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  })
);

export default router;
