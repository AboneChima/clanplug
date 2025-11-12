import { Router } from 'express';
import { walletService } from '../services/wallet.service';
import { Currency } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Test endpoint to add balance to user's wallet (for development only)
router.post('/add-balance', authenticate, async (req, res) => {
  try {
    const { amount, currency = 'NGN' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Add balance to user's wallet
    const result = await walletService.deposit(
      userId,
      Number(amount),
      currency as Currency,
      'Test deposit for development'
    );

    return res.json({
      success: true,
      message: `Successfully added ₦${amount} to your ${currency} wallet`,
      data: {
        wallet: result.wallet,
        transaction: result.transaction
      }
    });
  } catch (error) {
    console.error('Test add balance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add balance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;