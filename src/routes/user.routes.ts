import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireKYC } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { userService } from '../services/user.service';
import multer = require('multer');
import { body, param, query, validationResult } from 'express-validator';

type Profile = {
  id: string;
  name: string;
  username: string;
  email: string;
  notifications: { email: boolean; push: boolean };
  theme: 'light' | 'dark';
};

const profiles = new Map<string, Profile>();
const getDefaultProfile = (userId: string): Profile => ({
  id: userId,
  name: 'New User',
  username: `user_${userId}`,
  email: `user_${userId}@example.com`,
  notifications: { email: true, push: false },
  theme: 'light',
});

const router = Router();

// Multer memory storage for avatar uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

// GET /api/users/profile - Get user profile
router.get('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || 'unknown';
  const profile = profiles.get(userId) || getDefaultProfile(userId);
  profiles.set(userId, profile);
  res.json({ success: true, data: profile });
}));

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || 'unknown';
  const current = profiles.get(userId) || getDefaultProfile(userId);
  const { name, username, email, notifications, theme } = req.body as Partial<Profile>;
  const updated: Profile = {
    ...current,
    ...(name !== undefined ? { name } : {}),
    ...(username !== undefined ? { username } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(notifications !== undefined ? { notifications } : {}),
    ...(theme !== undefined ? { theme } : {}),
  };
  profiles.set(userId, updated);
  res.json({ success: true, data: updated });
}));

// POST /api/users/upload-avatar - Upload user avatar
router.post('/upload-avatar', authenticate, upload.single('avatar'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  const file = (req as any).file;
  if (!file) {
    res.status(400).json({ success: false, message: 'Avatar file is required' });
    return;
  }

  const result = await userService.uploadAvatar(userId, file.buffer, file.originalname);
  if (result.success) {
    res.json({ success: true, message: result.message, data: { url: result.url } });
    return;
  } else {
    res.status(400).json({ success: false, message: result.message, error: result.error });
    return;
  }
}));

// POST /api/users/kyc - Submit KYC verification
router.post('/kyc',
  authenticate,
  [
    body('documentType').isString().isLength({ min: 2 }).withMessage('Document type is required'),
    body('documentNumber').isString().isLength({ min: 4 }).withMessage('Document number is required'),
    body('firstName').isString().isLength({ min: 2 }).withMessage('First name is required'),
    body('lastName').isString().isLength({ min: 2 }).withMessage('Last name is required'),
    body('dateOfBirth').isISO8601().withMessage('Date of birth must be a valid ISO date'),
    body('address').isString().isLength({ min: 5 }).withMessage('Address is required'),
    body('phoneNumber').isString().isLength({ min: 7 }).withMessage('Phone number is required'),
    body('documentImages').optional().isArray(),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { documentType, documentNumber, documentImages, firstName, lastName, dateOfBirth, address, phoneNumber } = req.body;

    const result = await userService.submitKYC(userId, {
      documentType,
      documentNumber,
      documentImages,
      firstName,
      lastName,
      dateOfBirth,
      address,
      phoneNumber,
    });

    if (result.success) {
      res.status(201).json({ success: true, message: result.message, data: { kycId: result.kycId } });
    } else {
      res.status(400).json({ success: false, message: result.message, error: result.error });
    }
  })
);

// GET /api/users/kyc - Get KYC status
router.get('/kyc', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const result = await userService.getKYCStatus(userId);
  res.json({ success: result.success, message: result.message, data: result.data, status: result.status });
}));

// POST /api/users/kyc/:kycId/retry - Retry KYC verification
router.post('/kyc/:kycId/retry',
  authenticate,
  param('kycId').notEmpty().withMessage('KYC ID is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { kycId } = req.params;
    
    const result = await userService.retryKYCVerification(userId, kycId);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: result.message, 
        data: { status: result.status } 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.message, 
        error: result.error 
      });
    }
  })
);

// POST /api/users/follow/:userId - Follow a user
router.post('/follow/:userId',
  authenticate,
  requireKYC,
  param('userId').notEmpty().withMessage('User ID is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const followerId = (req as any).user?.id;
    const followingId = req.params.userId;
    const result = await userService.followUser(followerId, followingId);
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message, error: result.error });
    }
  })
);

// DELETE /api/users/follow/:userId - Unfollow a user
router.delete('/follow/:userId',
  authenticate,
  requireKYC,
  param('userId').notEmpty().withMessage('User ID is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const followerId = (req as any).user?.id;
    const followingId = req.params.userId;
    const result = await userService.unfollowUser(followerId, followingId);
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.message, error: result.error });
    }
  })
);

// GET /api/users/followers - Get user followers
router.get('/followers',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const result = await userService.getFollowers(userId, page, limit);
    res.json({ success: true, data: result.followers, pagination: result.pagination });
  })
);

// GET /api/users/following - Get users being followed
router.get('/following',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const result = await userService.getFollowing(userId, page, limit);
    res.json({ success: true, data: result.following, pagination: result.pagination });
  })
);

// GET /api/users/search - Search users
router.get('/search',
  authenticate,
  [
    query('q').isString().isLength({ min: 2 }).withMessage('Search query q is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query.q as string;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const result = await userService.searchUsers(q, page, limit);
    res.json({ success: true, data: result.users, pagination: result.pagination });
  })
);

// GET /api/users/:userId - Get user by ID
router.get('/:userId',
  authenticate,
  param('userId').notEmpty().withMessage('User ID is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await userService.getUserPublicById(req.params.userId);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'User not found' });
    }
  })
);

export default router;