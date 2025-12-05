import { Request, Response } from 'express';
import { prisma } from '../config/database';

export class DebugController {
  /**
   * Get all recent withdrawal transactions for debugging
   */
  async getAllWithdrawals(req: Request, res: Response) {
    try {
      const { secret } = req.query;

      if (secret !== 'debug-withdrawals-2024') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Get all withdrawal transactions from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const withdrawals = await prisma.transaction.findMany({
        where: {
          type: 'WITHDRAWAL',
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        include: {
          user: {
            select: {
              email: true,
              username: true
            }
          },
          wallet: {
            select: {
              balance: true,
              currency: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.json({
        success: true,
        data: {
          total: withdrawals.length,
          withdrawals: withdrawals.map(w => ({
            id: w.id,
            user: w.user.email,
            amount: w.amount.toNumber(),
            fee: w.fee?.toNumber() || 0,
            netAmount: w.netAmount?.toNumber() || 0,
            status: w.status,
            reference: w.reference,
            description: w.description,
            createdAt: w.createdAt,
            metadata: w.metadata,
            currentWalletBalance: w.wallet.balance.toNumber()
          }))
        }
      });
    } catch (error: any) {
      console.error('Get all withdrawals error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get withdrawals',
        error: error.message
      });
    }
  }

  /**
   * Manually refund a specific transaction
   */
  async manualRefund(req: Request, res: Response) {
    try {
      const { secret, transactionId } = req.body;

      if (secret !== 'manual-refund-2024') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          wallet: true,
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (transaction.type !== 'WITHDRAWAL') {
        return res.status(400).json({
          success: false,
          message: 'Not a withdrawal transaction'
        });
      }

      if (transaction.status === 'FAILED') {
        return res.status(400).json({
          success: false,
          message: 'Transaction already marked as failed'
        });
      }

      // Refund the transaction
      await prisma.$transaction(async (tx) => {
        // Add money back to wallet
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: { increment: transaction.amount },
            totalWithdrawals: { decrement: transaction.amount }
          }
        });

        // Update transaction status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(transaction.metadata as any),
              manualRefundAt: new Date().toISOString(),
              manualRefundReason: 'Flutterwave transfer failed - manual refund by admin'
            }
          }
        });
      });

      return res.json({
        success: true,
        message: 'Transaction refunded successfully',
        data: {
          transactionId: transaction.id,
          user: transaction.user.email,
          amount: transaction.amount.toNumber(),
          refundedAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Manual refund error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to refund transaction',
        error: error.message
      });
    }
  }
}

export const debugController = new DebugController();
