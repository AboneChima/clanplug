import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  submitKYC, 
  getKYCStatus, 
  listKYCSubmissions, 
  reviewKYC 
} from '../controllers/kyc.controller';

const router = Router();

// User endpoints
router.post('/submit', authenticate, asyncHandler(submitKYC));
router.get('/status', authenticate, asyncHandler(getKYCStatus));

// Admin endpoints
router.get('/admin/list', authenticate, requireAdmin, asyncHandler(listKYCSubmissions));
router.put('/admin/review/:id', authenticate, requireAdmin, asyncHandler(reviewKYC));

export default router;
