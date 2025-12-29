import { Router, Request, Response } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  submitKYC, 
  getKYCStatus, 
  listKYCSubmissions, 
  reviewKYC,
  deleteKYC
} from '../controllers/kyc.controller';

const router = Router();

// User endpoints
router.post('/submit', authenticate, asyncHandler(submitKYC));
router.get('/status', authenticate, asyncHandler(getKYCStatus));

// Admin endpoints
router.get('/admin/list', authenticate, adminOnly, asyncHandler(listKYCSubmissions));
router.put('/admin/review/:id', authenticate, adminOnly, asyncHandler(reviewKYC));
router.delete('/admin/delete/:id', authenticate, adminOnly, asyncHandler(deleteKYC));
router.post('/admin/bulk-approve', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { prisma } = await import('../config/database');
  
  try {
    // Get all pending KYC submissions
    const pendingKYCs = await prisma.kYCVerification.findMany({
      where: { status: 'PENDING' },
      include: { user: true }
    });

    if (pendingKYCs.length === 0) {
      res.json({
        success: true,
        message: 'No pending KYC submissions to approve',
        data: { count: 0 }
      });
      return;
    }

    // Approve all pending KYCs (remove reviewedAt as it doesn't exist in schema)
    await prisma.kYCVerification.updateMany({
      where: { status: 'PENDING' },
      data: {
        status: 'APPROVED'
      }
    });

    // Update all users to KYC verified
    const userIds = pendingKYCs.map(kyc => kyc.userId);
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isKYCVerified: true }
    });

    res.json({
      success: true,
      message: `Successfully approved ${pendingKYCs.length} KYC submissions`,
      data: { count: pendingKYCs.length }
    });
  } catch (error: any) {
    console.error('Bulk approve error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk approve KYC submissions',
      error: error.message
    });
  }
}));

export default router;
