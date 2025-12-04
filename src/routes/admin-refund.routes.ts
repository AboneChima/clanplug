import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { notificationService } from '../services/notification.service';

const router = Router();

// Secret key for admin operations
const ADMIN_SECRET = 'refund-withdrawal-2024';

/**
 * Refund pending withdrawals for a user
 * POST /api/admin-refund/process
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { email, secret } = req.body;

    // Verify admin secret
    if (secret !== ADMIN_SECRET) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin secret'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find pending withdrawals
    const pendingWithdrawals = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'WITHDRAWAL',
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (pendingWithdrawals.length === 0) {
      return res.json({
        success: true,
        message: 'No pending withdrawals found',
        data: { refunded: 0, amount: 0 }
      });
    }

    let totalRefunded = 0;
    const refundedTransactions = [];

    // Process refunds
    for (const withdrawal of pendingWithdrawals) {
      const amount = withdrawal.amount.toNumber();
      const totalRefund = amount;

      // Get wallet
      const wallet = await prisma.wallet.findUnique({
        where: {
          userId_currency: {
            userId: user.id,
            currency: 'NGN'
          }
        }
      });

      if (!wallet) continue;

      // Refund transaction
      await prisma.$transaction(async (tx) => {
        // Credit wallet back
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: totalRefund },
            totalWithdrawals: { decrement: amount }
          }
        });

        // Update transaction status
        await tx.transaction.update({
          where: { id: withdrawal.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(withdrawal.metadata as any || {}),
              refundedAt: new Date().toISOString(),
              refundReason: 'Manual refund - withdrawal took too long',
              refundedAmount: totalRefund
            }
          }
        });
      });

      // Send notification
      await notificationService.createNotification({
        userId: user.id,
        type: 'TRANSACTION',
        title: 'Withdrawal Refunded',
        message: `Your withdrawal of ₦${amount.toLocaleString()} has been refunded. You can withdraw again using the new instant system.`,
        data: {
          type: 'refund',
          amount: totalRefund,
          currency: 'NGN',
          originalReference: withdrawal.reference
        }
      });

      totalRefunded += totalRefund;
      refundedTransactions.push({
        reference: withdrawal.reference,
        amount: totalRefund,
        date: withdrawal.createdAt
      });
    }

    // Get updated balance
    const updatedWallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId: user.id,
          currency: 'NGN'
        }
      }
    });

    return res.json({
      success: true,
      message: `Refunded ${pendingWithdrawals.length} withdrawal(s)`,
      data: {
        user: {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`
        },
        refunded: pendingWithdrawals.length,
        totalAmount: totalRefunded,
        newBalance: updatedWallet?.balance.toNumber() || 0,
        transactions: refundedTransactions
      }
    });

  } catch (error: any) {
    console.error('Refund error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
});

export default router;
