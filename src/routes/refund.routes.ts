import { Router } from 'express';
import { refundController } from '../controllers/refund.controller';

const router = Router();

// GET /api/refund/check - Check for failed withdrawals (dry run)
router.get('/check', refundController.checkFailedWithdrawals.bind(refundController));

// POST /api/refund/process - Process refunds for failed withdrawals
router.post('/process', refundController.refundFailedWithdrawals.bind(refundController));

export default router;
