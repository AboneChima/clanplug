import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireKYC } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { userService } from '../services/user.service';
import multer = require('multer');
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database';

// User routes with verification badge support
const router = Router();

// Multer memory storage for avatar uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    return;
  }
  next();
};

// GET /api/users/profile - Get user profile
router.get('/profile', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  // Fetch user with verification badge
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      verificationBadge: true,
    },
  });
  
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  
  // Check verification status
  let verificationStatus = 'none';
  let daysRemaining = 0;
  
  if (user.verificationBadge) {
    verificationStatus = user.verificationBadge.status;
    
    if (verificationStatus === 'verified' && user.verificationBadge.expiresAt) {
      const diff = user.verificationBadge.expiresAt.getTime() - new Date().getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      // Auto-expire if needed
      if (daysRemaining <= 0) {
        await prisma.verificationBadge.update({
          where: { userId },
          data: { status: 'expired' },
        });
        verificationStatus = 'expired';
        daysRemaining = 0;
      }
    }
  }
  
  const profile = {
    ...user,
    verificationStatus,
    verificationDaysRemaining: daysRemaining,
  };
  
  res.json({ success: true, data: profile });
}));

// PUT /api/users/profile - Update user profile (with optional avatar upload)
router.put('/profile', authenticate, upload.single('avatar'), asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const file = (req as any).file;
  
  // Handle avatar upload if file is present
  if (file) {
    const uploadResult = await userService.uploadAvatar(userId, file.buffer, file.originalname);
    if (uploadResult.success) {
      // Update user avatar in database
      const updateResult = await userService.updateUserProfile(userId, { avatar: uploadResult.url });
      if (updateResult.success) {
        res.json({ 
          success: true, 
          message: 'Profile picture updated successfully',
          user: updateResult.user,
          avatar: uploadResult.url
        });
        return;
      }
    }
    res.status(400).json({ success: false, message: uploadResult.message || 'Failed to upload avatar' });
    return;
  }
  
  // Handle other profile updates
  const { firstName, lastName, bio, city, state, country, website } = req.body;
  const updateData: any = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (bio !== undefined) updateData.bio = bio;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (country !== undefined) updateData.country = country;
  
  const result = await userService.updateUserProfile(userId, updateData);
  if (result.success) {
    res.json({ success: true, message: 'Profile updated successfully', user: result.user });
  } else {
    res.status(400).json({ success: false, message: result.message || 'Failed to update profile' });
  }
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

// POST /api/users/follow/:userId - Follow a user (removed KYC requirement)
router.post('/follow/:userId',
  authenticate,
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

// DELETE /api/users/follow/:userId - Unfollow a user (removed KYC requirement)
router.delete('/follow/:userId',
  authenticate,
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

// GET /api/users/suggested - Get suggested users to follow
router.get('/suggested',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const limit = parseInt((req.query.limit as string) || '10', 10);
    
    // Get users that the current user is not following
    const users = await userService.getSuggestedUsers(userId, limit);
    res.json({ success: true, users });
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

// GET /api/users/username/:username - Get user by username
router.get('/username/:username',
  authenticate,
  param('username').notEmpty().withMessage('Username is required'),
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const username = req.params.username;
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          verificationBadge: {
            select: {
              status: true
            }
          }
        }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message || 'User not found' });
    }
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