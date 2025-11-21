import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { passwordResetController } from '../controllers/password-reset.controller';

const router = Router();

// POST /api/password-reset/request - Request password reset
router.post('/request', asyncHandler(passwordResetController.requestReset.bind(passwordResetController)));

// GET /api/password-reset/verify - Verify reset token
router.get('/verify', asyncHandler(passwordResetController.verifyToken.bind(passwordResetController)));

// POST /api/password-reset/reset - Reset password
router.post('/reset', asyncHandler(passwordResetController.resetPassword.bind(passwordResetController)));

export default router;
