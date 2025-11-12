import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  register, 
  login, 
  refresh, 
  logout, 
  adminLogin, 
  forgotPassword, 
  resetPassword, 
  verifyEmail, 
  resendVerification 
} from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/register - User registration
router.post('/register', asyncHandler(register));

// POST /api/auth/login - User login
router.post('/login', asyncHandler(login));

// POST /api/auth/admin-login - Admin login
router.post('/admin-login', asyncHandler(adminLogin));

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', asyncHandler(refresh));

// POST /api/auth/logout - User logout (allows invalid tokens)
router.post('/logout', asyncHandler(logout));

// POST /api/auth/forgot-password - Forgot password
router.post('/forgot-password', asyncHandler(forgotPassword));

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', asyncHandler(resetPassword));

// POST /api/auth/verify-email - Verify email
router.post('/verify-email', asyncHandler(verifyEmail));

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', asyncHandler(resendVerification));

export default router;