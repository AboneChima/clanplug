import { Request, Response } from 'express';
import { prisma } from '../config/database';

export class RefundController {
  /**
   * Refund failed withdrawals that deducted money but never sent
   */
  async refundFailedWithdrawals(req: Request, res: Response) {
    try {
      const { secret } = req.body;

      // Security check
      if (secret !== 'refund-failed-withdrawals-2024') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Find all PROCESSING or COMPLETED transactions that have FAILED Flutterwave status
      const suspectTransactions = await prisma.transaction.findMany({
        where: {
          type: 'WITHDRAWAL',
          status: {
            in: ['PROCESSING', 'COMPLETED']
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          },
          wallet: true
        }
      });

      const refunds: any[] = [];
      const errors: any[] = [];

      for (const transaction of suspectTransactions) {
        try {
          const metadata = transaction.metadata as any;
          const flutterwaveStatus = metadata?.flutterwaveStatus;

          // Check if Flutterwave transfer actually failed
          if (flutterwaveStatus === 'FAILED') {
            // Refund the user
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
                    ...metadata,
                    refundedAt: new Date().toISOString(),
                    refundReason: 'Flutterwave transfer failed - automatic refund'
                  }
                }
              });
            });

            refunds.push({
              transactionId: transaction.id,
              userId: transaction.user.email,
              amount: transaction.amount.toNumber(),
              reference: transaction.reference,
              status: 'REFUNDED'
            });
          }
        } catch (error: any) {
          errors.push({
            transactionId: transaction.id,
            error: error.message
          });
        }
      }

      return res.json({
        success: true,
        message: `Processed ${suspectTransactions.length} transactions`,
        data: {
          refunded: refunds.length,
          errorCount: errors.length,
          refunds,
          errors
        }
      });
    } catch (error: any) {
      console.error('Refund failed withdrawals error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process refunds',
        error: error.message
      });
    }
  }

  /**
   * Check for transactions that need refund (dry run)
   */
  async checkFailedWithdrawals(req: Request, res: Response) {
    try {
      const { secret } = req.query;

      // Security check
      if (secret !== 'refund-failed-withdrawals-2024') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Find all PROCESSING or COMPLETED transactions
      const suspectTransactions = await prisma.transaction.findMany({
        where: {
          type: 'WITHDRAWAL',
          status: {
            in: ['PROCESSING', 'COMPLETED']
          }
        },
        include: {
          user: {
            select: {
              email: true,
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const needsRefund = suspectTransactions.filter(t => {
        const metadata = t.metadata as any;
        return metadata?.flutterwaveStatus === 'FAILED';
      });

      return res.json({
        success: true,
        data: {
          total: suspectTransactions.length,
          needsRefund: needsRefund.length,
          transactions: needsRefund.map(t => ({
            id: t.id,
            user: t.user.email,
            amount: t.amount.toNumber(),
            reference: t.reference,
            status: t.status,
            flutterwaveStatus: (t.metadata as any)?.flutterwaveStatus,
            createdAt: t.createdAt,
            message: (t.metadata as any)?.flutterwaveResponse?.complete_message
          }))
        }
      });
    } catch (error: any) {
      console.error('Check failed withdrawals error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check transactions',
        error: error.message
      });
    }
  }
}

export const refundController = new RefundController();
