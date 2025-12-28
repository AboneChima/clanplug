import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';

const router = Router();

// POST /api/refund/test-purchase - Refund test purchases for a user
router.post('/test-purchase',
  authenticate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    // Only allow for specific test user
    if (userEmail !== 'abonejoseph@gmail.com') {
      res.status(403).json({
        success: false,
        message: 'This endpoint is only for test refunds'
      });
      return;
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find all funded/pending escrows for this user
        const escrows = await tx.escrow.findMany({
          where: {
            buyerId: userId,
            status: { in: ['FUNDED', 'PENDING'] }
          },
          include: {
            post: true
          }
        });

        if (escrows.length === 0) {
          return {
            success: false,
            message: 'No test purchases found to refund',
            refundedCount: 0,
            totalRefunded: 0
          };
        }

        let totalRefunded = 0;

        // Process each escrow
        for (const escrow of escrows) {
          const refundAmount = Number(escrow.amount) + Number(escrow.fee);
          totalRefunded += refundAmount;

          // Refund to wallet
          await tx.wallet.update({
            where: {
              userId_currency: {
                userId: userId,
                currency: escrow.currency
              }
            },
            data: {
              balance: { increment: refundAmount }
            }
          });

          // Mark escrow as refunded
          await tx.escrow.update({
            where: { id: escrow.id },
            data: {
              status: 'REFUNDED',
              updatedAt: new Date()
            }
          });

          // Mark post as active again
          if (escrow.postId) {
            await tx.post.update({
              where: { id: escrow.postId },
              data: {
                status: 'ACTIVE',
                soldToId: null,
                soldAt: null
              }
            });
          }
        }

        // Create notification
        await tx.notification.create({
          data: {
            userId: userId,
            type: 'SYSTEM',
            title: '💰 Test Purchases Refunded',
            message: `${escrows.length} test purchase(s) have been refunded. Total: ${totalRefunded} ${escrows[0].currency}`,
            data: {
              refundedCount: escrows.length,
              totalRefunded: totalRefunded
            }
          }
        });

        return {
          success: true,
          message: 'Test purchases refunded successfully',
          refundedCount: escrows.length,
          totalRefunded: totalRefunded,
          currency: escrows[0].currency
        };
      });

      res.json(result);
    } catch (error) {
      console.error('Refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

export default router;
