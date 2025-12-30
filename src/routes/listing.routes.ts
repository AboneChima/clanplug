import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireKYC } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { listingController } from '../controllers/listing.controller';

const router = Router();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

// POST /api/listings - Create a listing (seller)
router.post(
  '/',
  authenticate,
  requireKYC,
  [
    body('title').isString().isLength({ min: 3 }).withMessage('Title is required'),
    body('description').isString().isLength({ min: 10 }).withMessage('Description is required'),
    body('category').isString().withMessage('Category is required'),
    body('type').isString().withMessage('Type is required'),
    body('price').isFloat({ min: 1 }).withMessage('Price must be >= 1'),
    body('currency').isString().withMessage('Currency is required'),
    body('images').optional().isArray().withMessage('Images must be an array'),
    body('videos').optional().isArray().withMessage('Videos must be an array'),
  ],
  handleValidationErrors,
  asyncHandler(listingController.createListing.bind(listingController))
);

// GET /api/listings - Browse listings
router.get(
  '/',
  [
    query('category').optional().isString(),
    query('type').optional().isString(),
    query('platform').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('search').optional().isString(),
    query('status').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  asyncHandler(listingController.getListings.bind(listingController))
);

// GET /api/listings/counts - Get listing counts per category
router.get(
  '/counts',
  asyncHandler(listingController.getListingCounts.bind(listingController))
);

// GET /api/listings/me - Seller listings
router.get(
  '/me',
  authenticate,
  [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })],
  handleValidationErrors,
  asyncHandler(listingController.getMyListings.bind(listingController))
);

// GET /api/listings/:id - Get listing details
router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Listing ID is required')],
  handleValidationErrors,
  asyncHandler(listingController.getListingById.bind(listingController))
);

// PUT /api/listings/:id - Update listing
router.put(
  '/:id',
  authenticate,
  [param('id').isString().notEmpty().withMessage('Listing ID is required')],
  handleValidationErrors,
  asyncHandler(listingController.updateListing.bind(listingController))
);

// DELETE /api/listings/:id - Delete listing
router.delete(
  '/:id',
  authenticate,
  [param('id').isString().notEmpty().withMessage('Listing ID is required')],
  handleValidationErrors,
  asyncHandler(listingController.deleteListing.bind(listingController))
);

export default router;