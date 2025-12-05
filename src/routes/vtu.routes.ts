import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireKYC } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { vtuController } from '../controllers/vtu.controller';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VTU Validation Error:', {
      body: req.body,
      errors: errors.array(),
    });
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};

// GET /api/vtu/services - Get available VTU services
router.get('/services', authenticate, asyncHandler(vtuController.getServices.bind(vtuController)));

// GET /api/vtu/networks - Get available networks
router.get('/networks', authenticate, asyncHandler(vtuController.getProviders.bind(vtuController)));

// GET /api/vtu/data-plans/:network - Get data plans for network
router.get('/data-plans/:network', 
  authenticate,
  param('network').notEmpty().withMessage('Network is required'),
  handleValidationErrors,
  asyncHandler(vtuController.getDataPlans.bind(vtuController))
);

// POST /api/vtu/airtime - Purchase airtime (KYC not required)
router.post('/airtime', 
  authenticate,
  [
    body('network').notEmpty().withMessage('Network is required'),
    body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number is required'),
    body('amount').isFloat({ min: 50, max: 50000 }).withMessage('Amount must be between ₦50 and ₦50,000'),
  ],
  handleValidationErrors,
  asyncHandler(vtuController.purchaseAirtime.bind(vtuController))
);

// POST /api/vtu/data - Purchase data (KYC not required)
router.post('/data', 
  authenticate,
  [
    body('network').notEmpty().withMessage('Network is required'),
    body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number is required'),
    body('planId').notEmpty().withMessage('Data plan is required'),
    body('amount').isFloat({ min: 50 }).withMessage('Amount must be at least ₦50'),
  ],
  handleValidationErrors,
  asyncHandler(vtuController.purchaseData.bind(vtuController))
);

// GET /api/vtu/transactions - Get VTU transaction history
router.get('/transactions', 
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  asyncHandler(vtuController.getUserTransactions.bind(vtuController))
);

// GET /api/vtu/transactions/:transactionId - Get VTU transaction details
router.get('/transactions/:transactionId', 
  authenticate,
  param('transactionId').notEmpty().withMessage('Transaction ID is required'),
  handleValidationErrors,
  asyncHandler(vtuController.getTransactionById.bind(vtuController))
);

// POST /api/vtu/verify-number - Verify phone number for VTU
router.post('/verify-number', 
  authenticate,
  [
    body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number is required'),
    body('network').notEmpty().withMessage('Network is required'),
  ],
  handleValidationErrors,
  asyncHandler(vtuController.verifyPhoneNumber.bind(vtuController))
);

export default router;