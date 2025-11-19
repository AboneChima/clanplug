import { Router, Request, Response } from 'express';
import paymentController from '../controllers/payment.controller';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { body, query } from 'express-validator';

const router = Router();

// Validation middleware
const depositValidation = [
  body('amount')
    .isNumeric()
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    })
    .withMessage('Valid amount is required'),
  body('currency')
    .isIn(['NGN', 'USD'])
    .withMessage('Currency must be NGN or USD'),
  body('gateway')
    .optional()
    .isIn(['flutterwave'])
    .withMessage('Gateway must be flutterwave'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must be a string with max 255 characters')
];

const withdrawalValidation = [
  body('amount')
    .isNumeric()
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    })
    .withMessage('Valid amount is required'),
  body('currency')
    .isIn(['NGN'])
    .withMessage('Currency must be NGN for withdrawals'),
  body('accountNumber')
    .isString()
    .trim()
    .isLength({ min: 8, max: 15 })
    .withMessage('Account number must be between 8 and 15 digits'),
  body('bankCode')
    .isString()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Bank code must be 3 digits'),
  body('accountName')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Account name is required'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must be a string with max 255 characters')
];

const verifyPaymentValidation = [
  body('reference')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Reference is required'),
  body('gateway')
    .optional()
    .isIn(['flutterwave'])
    .withMessage('Gateway must be flutterwave')
];

const verifyAccountValidation = [
  body('accountNumber')
    .isString()
    .trim()
    .isLength({ min: 8, max: 15 })
    .withMessage('Account number must be between 8 and 15 digits'),
  body('bankCode')
    .isString()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage('Bank code must be 3 digits')
];

// Payment routes
router.post(
  '/deposit/initiate',
  authenticate,
  depositValidation,
  validateRequest,
  asyncHandler(paymentController.initiateDeposit.bind(paymentController))
);

router.post(
  '/withdraw/initiate',
  authenticate,
  withdrawalValidation,
  validateRequest,
  asyncHandler(paymentController.initiateWithdrawal.bind(paymentController))
);

// Payment gateway callbacks (no auth required)
router.get(
  '/paystack/callback',
  [
    query('reference')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Reference is required')
  ],
  validateRequest,
  asyncHandler(paymentController.paystackCallback.bind(paymentController))
);

router.get(
  '/flutterwave/callback',
  [
    query('transaction_id')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Transaction ID must be a valid string')
  ],
  validateRequest,
  asyncHandler(paymentController.flutterwaveCallback.bind(paymentController))
);

// Manual payment verification
router.post(
  '/verify',
  verifyPaymentValidation,
  validateRequest,
  asyncHandler(paymentController.verifyPayment.bind(paymentController))
);

// Bank-related endpoints
router.get(
  '/banks',
  asyncHandler(paymentController.getBanks.bind(paymentController))
);

router.post(
  '/verify-account',
  verifyAccountValidation,
  validateRequest,
  asyncHandler(paymentController.verifyBankAccount.bind(paymentController))
);

// Test route to verify payment routes are loading
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Payment routes are working!' });
});

export default router;