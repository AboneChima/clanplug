import { Router } from 'express';
import { debugController } from '../controllers/debug.controller';

const router = Router();

// GET /api/debug/withdrawals - Get all withdrawal transactions
router.get('/withdrawals', debugController.getAllWithdrawals.bind(debugController));

// POST /api/debug/refund - Manually refund a transaction
router.post('/refund', debugController.manualRefund.bind(debugController));

export default router;
