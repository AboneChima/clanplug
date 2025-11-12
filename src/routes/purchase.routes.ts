import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, requireKYC } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { purchaseController } from '../controllers/purchase.controller';

const router = Router();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

// POST /api/purchases - Initiate purchase for a listing (creates escrow)
router.post(
  '/',
  authenticate,
  requireKYC,
  [body('listingId').isString().notEmpty().withMessage('listingId is required')],
  handleValidationErrors,
  asyncHandler(purchaseController.initiate.bind(purchaseController))
);

// POST /api/purchases/:purchaseId/deliver - Seller delivers account credentials
router.post(
  '/:purchaseId/deliver',
  authenticate,
  requireKYC,
  [
    param('purchaseId').isString().notEmpty().withMessage('purchaseId is required'),
    body('accountDetails').isObject().withMessage('accountDetails is required'),
    body('accountDetails.username').isString().notEmpty().withMessage('accountDetails.username is required'),
    body('accountDetails.password').isString().notEmpty().withMessage('accountDetails.password is required'),
  ],
  handleValidationErrors,
  asyncHandler(purchaseController.deliver.bind(purchaseController))
);

// POST /api/purchases/:purchaseId/confirm - Buyer confirms delivery and releases escrow
router.post(
  '/:purchaseId/confirm',
  authenticate,
  requireKYC,
  [param('purchaseId').isString().notEmpty().withMessage('purchaseId is required')],
  handleValidationErrors,
  asyncHandler(purchaseController.confirm.bind(purchaseController))
);

export default router;