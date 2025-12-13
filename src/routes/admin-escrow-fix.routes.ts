import { Router, Request, Response } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';

const router = Router();

// POST /api/admin/escrow/refund-all - Refund all active escrows (EMERGENCY FIX)
router.post('/refund-all',
  authenticate,
  adminOnly,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Find all FUNDED or PENDING escrows
      const activeEscrows = await prisma.escrow.findMany({
        where: {
          status: {
            in: ['FUNDED', 'PENDING']
          }
        },
        include: {
          buyer: true,
          seller: true
        }
      });

      const results = [];

      for (const escrow of activeEscrows) {
        try {
          // Refund money to buyer
          await prisma.$transaction(async (tx) => {
            // Get buyer's wallet
            const wallet = await tx.wallet.findUnique({
              where: {
                userId_currency: {
                  userId: escrow.buyerId,
                  currency: escrow.currency
                }
              }
            });

            if (!wallet) {
              throw new Error(`Wallet not found for buyer ${escrow.buyer.username}`);
            }

            // Calculate total amount (amount + fee)
            const totalAmount = parseFloat(escrow.amount.toString()) + parseFloat(escrow.fee.toString());

            // Refund to buyer's wallet
            await tx.wallet.update({
              where: {
                userId_currency: {
                  userId: escrow.buyerId,
                  currency: escrow.currency
                }
              },
              data: {
                balance: {
                  increment: totalAmount
                }
              }
            });

            // Create refund transaction
            await tx.transaction.create({
              data: {
                userId: escrow.buyerId,
                walletId: wallet.id,
                type: 'ESCROW_REFUND',
                status: 'COMPLETED',
                amount: totalAmount,
                fee: 0,
                netAmount: totalAmount,
                currency: escrow.currency,
                reference: `REFUND-${escrow.id}`,
                description: `Escrow refund: ${escrow.title}`
              }
            });

            // Update escrow status
            await tx.escrow.update({
              where: { id: escrow.id },
              data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: 'Admin refund - System fix'
              }
            });

            // Notify buyer
            await tx.notification.create({
              data: {
                userId: escrow.buyerId,
                type: 'ESCROW',
                title: '✅ Escrow Refunded',
                message: `Your escrow payment of ${totalAmount} ${escrow.currency} has been refunded to your wallet.`,
                data: {
                  escrowId: escrow.id,
                  amount: totalAmount,
                  currency: escrow.currency
                }
              }
            });
          });

          results.push({
            escrowId: escrow.id,
            buyer: escrow.buyer.username,
            amount: escrow.amount,
            currency: escrow.currency,
            status: 'refunded'
          });
        } catch (error: any) {
          results.push({
            escrowId: escrow.id,
            buyer: escrow.buyer.username,
            amount: escrow.amount,
            currency: escrow.currency,
            status: 'failed',
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Processed ${activeEscrows.length} escrows`,
        data: results
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to refund escrows',
        error: error.message
      });
    }
  })
);

export default router;
