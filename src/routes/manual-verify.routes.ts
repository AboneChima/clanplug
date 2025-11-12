import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

/**
 * POST /api/manual-verify/payment
 * Manually verify and complete a pending payment
 */
router.post('/payment', authenticate, async (req: Request, res: Response) => {
  try {
    const { reference } = req.body;
    const userId = req.user!.id;

    if (!reference) {
      res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
      return;
    }

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { wallet: true }
    });

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }

    // Verify it belongs to the user
    if (transaction.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    // Check if already completed
    if (transaction.status === 'COMPLETED') {
      res.status(200).json({
        success: true,
        message: 'Payment already completed',
        data: {
          amount: transaction.amount,
          currency: transaction.currency,
          balance: transaction.wallet.balance
        }
      });
      return;
    }

    // Check if pending
    if (transaction.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        message: `Cannot complete transaction with status: ${transaction.status}`
      });
      return;
    }

    // Update transaction to completed
    await prisma.transaction.update({
      where: { reference },
      data: {
        status: 'COMPLETED',
        metadata: {
          ...(transaction.metadata as any || {}),
          manuallyVerified: true,
          verifiedAt: new Date().toISOString()
        }
      }
    });

    // Update wallet balance
    const currentBalance = parseFloat(transaction.wallet.balance.toString());
    const newBalance = currentBalance + parseFloat(transaction.amount.toString());

    await prisma.wallet.update({
      where: { id: transaction.walletId },
      data: {
        balance: newBalance.toString()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and completed successfully',
      data: {
        amount: transaction.amount,
        currency: transaction.currency,
        previousBalance: currentBalance,
        newBalance: newBalance
      }
    });

  } catch (error: any) {
    console.error('Manual verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

/**
 * GET /api/manual-verify/pending
 * Get user's pending transactions
 */
router.get('/pending', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const pending = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'PENDING',
        type: 'DEPOSIT'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    res.status(200).json({
      success: true,
      data: pending
    });

  } catch (error: any) {
    console.error('Get pending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending transactions',
      error: error.message
    });
  }
});

export default router;
