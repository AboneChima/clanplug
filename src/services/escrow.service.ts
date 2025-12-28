import { PrismaClient, EscrowStatus, Currency, NotificationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface CreateEscrowRequest {
  buyerId: string;
  sellerId: string;
  postId?: string;
  amount: number;
  currency: Currency;
  title: string;
  description: string;
  terms?: string;
  autoReleaseHours?: number;
}

export interface EscrowMessage {
  id: string;
  escrowId: string;
  senderId: string;
  message: string;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface EscrowResponse {
  success: boolean;
  message: string;
  escrow?: any;
  error?: string;
}

export interface EscrowListResponse {
  escrows: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class EscrowService {
  private calculateFee(amount: number): number {
    // 0.5% escrow fee
    return Math.round(amount * 0.005 * 100) / 100;
  }

  async createEscrow(request: CreateEscrowRequest): Promise<EscrowResponse> {
    try {
      // Validate users exist
      const [buyer, seller] = await Promise.all([
        prisma.user.findUnique({ where: { id: request.buyerId } }),
        prisma.user.findUnique({ where: { id: request.sellerId } })
      ]);

      if (!buyer || !seller) {
        return {
          success: false,
          message: 'Buyer or seller not found',
          error: 'USER_NOT_FOUND'
        };
      }

      if (buyer.id === seller.id) {
        return {
          success: false,
          message: 'Buyer and seller cannot be the same user',
          error: 'INVALID_USERS'
        };
      }

      // Validate post if provided
      if (request.postId) {
        const post = await prisma.post.findUnique({
          where: { id: request.postId }
        });

        if (!post) {
          return {
            success: false,
            message: 'Post not found',
            error: 'POST_NOT_FOUND'
          };
        }

        if (post.userId !== request.sellerId) {
          return {
            success: false,
            message: 'Post does not belong to the seller',
            error: 'INVALID_POST_OWNER'
          };
        }
      }

      const fee = this.calculateFee(request.amount);
      const totalAmount = request.amount + fee;
      const autoReleaseAt = request.autoReleaseHours 
        ? new Date(Date.now() + request.autoReleaseHours * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

      // Check if buyer has sufficient balance
      const buyerWallet = await prisma.wallet.findUnique({
        where: {
          userId_currency: {
            userId: request.buyerId,
            currency: request.currency
          }
        }
      });

      if (!buyerWallet || buyerWallet.balance.toNumber() < totalAmount) {
        return {
          success: false,
          message: `Insufficient balance. You need ${totalAmount} ${request.currency} (including ${fee} ${request.currency} escrow fee)`,
          error: 'INSUFFICIENT_BALANCE'
        };
      }

      // Create escrow and deduct money in a transaction
      const escrow = await prisma.$transaction(async (tx) => {
        // Deduct money from buyer's wallet
        await tx.wallet.update({
          where: {
            userId_currency: {
              userId: request.buyerId,
              currency: request.currency
            }
          },
          data: {
            balance: {
              decrement: totalAmount
            }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: request.buyerId,
            walletId: buyerWallet.id,
            type: 'ESCROW_DEPOSIT',
            status: 'COMPLETED',
            amount: totalAmount,
            fee: fee,
            netAmount: request.amount,
            currency: request.currency,
            reference: `ESC-${uuidv4()}`,
            description: `Escrow payment for: ${request.title}`
          }
        });

        // Create escrow with FUNDED status
        const newEscrow = await tx.escrow.create({
          data: {
            buyerId: request.buyerId,
            sellerId: request.sellerId,
            postId: request.postId,
            amount: request.amount,
            fee,
            currency: request.currency,
            title: request.title,
            description: request.description,
            terms: request.terms,
            autoReleaseAt,
            status: EscrowStatus.FUNDED, // Automatically funded
            fundedAt: new Date()
          },
          include: {
            buyer: {
              select: { id: true, username: true, email: true, avatar: true }
            },
            seller: {
              select: { id: true, username: true, email: true, avatar: true }
            },
            post: {
              select: { id: true, title: true, price: true, currency: true }
            }
          }
        });

        // Notify seller
        await tx.notification.create({
          data: {
            userId: request.sellerId,
            type: 'ESCROW',
            title: '💰 New Escrow Payment',
            message: `${buyer.username} has paid ${request.amount} ${request.currency} for "${request.title}". Please deliver the item.`,
            data: {
              escrowId: newEscrow.id,
              amount: request.amount,
              currency: request.currency
            }
          }
        });

        // Mark post as SOLD if postId is provided
        if (request.postId) {
          await tx.post.update({
            where: { id: request.postId },
            data: { status: 'SOLD' }
          });
        }

        return newEscrow;
      });

      return {
        success: true,
        message: 'Escrow created and funded successfully',
        escrow
      };
    } catch (error) {
      console.error('Create escrow error:', error);
      return {
        success: false,
        message: 'Failed to create escrow',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  async getEscrowById(escrowId: string, userId: string): Promise<any> {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId },
        include: {
          buyer: {
            select: { id: true, username: true, email: true, avatar: true }
          },
          seller: {
            select: { id: true, username: true, email: true, avatar: true }
          },
          post: {
            select: { id: true, title: true, price: true, currency: true, images: true }
          }
        }
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Check if user is authorized to view this escrow
      if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
        throw new Error('Unauthorized to view this escrow');
      }

      return escrow;
    } catch (error) {
      console.error('Get escrow error:', error);
      throw error;
    }
  }

  async getUserEscrows(userId: string, page: number = 1, limit: number = 20): Promise<EscrowListResponse> {
    try {
      const skip = (page - 1) * limit;

      const [escrows, total] = await Promise.all([
        prisma.escrow.findMany({
          where: {
            OR: [
              { buyerId: userId },
              { sellerId: userId }
            ]
          },
          include: {
            buyer: {
              select: { id: true, username: true, avatar: true }
            },
            seller: {
              select: { id: true, username: true, avatar: true }
            },
            post: {
              select: { id: true, title: true, price: true, currency: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.escrow.count({
          where: {
            OR: [
              { buyerId: userId },
              { sellerId: userId }
            ]
          }
        })
      ]);

      return {
        escrows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get user escrows error:', error);
      throw error;
    }
  }

  async acceptEscrow(escrowId: string, sellerId: string): Promise<EscrowResponse> {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      if (escrow.sellerId !== sellerId) {
        return {
          success: false,
          message: 'Only the seller can accept this escrow',
          error: 'UNAUTHORIZED'
        };
      }

      if (escrow.status !== EscrowStatus.PENDING) {
        return {
          success: false,
          message: 'Escrow is not in pending status',
          error: 'INVALID_STATUS'
        };
      }

      const updatedEscrow = await prisma.escrow.update({
        where: { id: escrowId },
        data: { status: EscrowStatus.PENDING }, // Keep as pending until funded
        include: {
          buyer: {
            select: { id: true, username: true, email: true }
          },
          seller: {
            select: { id: true, username: true, email: true }
          }
        }
      });

      return {
        success: true,
        message: 'Escrow accepted successfully. Waiting for buyer to fund.',
        escrow: updatedEscrow
      };
    } catch (error) {
      console.error('Accept escrow error:', error);
      return {
        success: false,
        message: 'Failed to accept escrow',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  async rejectEscrow(escrowId: string, sellerId: string, reason?: string): Promise<EscrowResponse> {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      if (escrow.sellerId !== sellerId) {
        return {
          success: false,
          message: 'Only the seller can reject this escrow',
          error: 'UNAUTHORIZED'
        };
      }

      if (escrow.status !== EscrowStatus.PENDING) {
        return {
          success: false,
          message: 'Escrow is not in pending status',
          error: 'INVALID_STATUS'
        };
      }

      const updatedEscrow = await prisma.escrow.update({
        where: { id: escrowId },
        data: { 
          status: EscrowStatus.CANCELLED,
          adminNotes: reason || 'Rejected by seller'
        },
        include: {
          buyer: {
            select: { id: true, username: true, email: true }
          },
          seller: {
            select: { id: true, username: true, email: true }
          }
        }
      });

      return {
        success: true,
        message: 'Escrow rejected successfully',
        escrow: updatedEscrow
      };
    } catch (error) {
      console.error('Reject escrow error:', error);
      return {
        success: false,
        message: 'Failed to reject escrow',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  async fundEscrow(escrowId: string, buyerId: string): Promise<EscrowResponse> {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      if (escrow.buyerId !== buyerId) {
        return {
          success: false,
          message: 'Only the buyer can fund this escrow',
          error: 'UNAUTHORIZED'
        };
      }

      if (escrow.status !== EscrowStatus.PENDING) {
        return {
          success: false,
          message: 'Escrow is not in pending status',
          error: 'INVALID_STATUS'
        };
      }

      // Check buyer's wallet balance (wallet scoped by currency)
      const buyerWallet = await prisma.wallet.findUnique({
        where: { userId_currency: { userId: buyerId, currency: escrow.currency } }
      });

      if (!buyerWallet) {
        return {
          success: false,
          message: 'Buyer wallet not found',
          error: 'WALLET_NOT_FOUND'
        };
      }

      const totalAmount = Number(escrow.amount) + Number(escrow.fee);
      const walletBalance = Number(buyerWallet.balance);

      if (walletBalance < totalAmount) {
        return {
          success: false,
          message: `Insufficient balance. Required: ${totalAmount} ${escrow.currency}`,
          error: 'INSUFFICIENT_BALANCE'
        };
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct from buyer's wallet
        await tx.wallet.update({
          where: { userId_currency: { userId: buyerId, currency: escrow.currency } },
          data: { balance: { decrement: totalAmount } }
        });

        // Update escrow status
        const updatedEscrow = await tx.escrow.update({
          where: { id: escrowId },
          data: { 
            status: EscrowStatus.FUNDED,
            fundedAt: new Date()
          },
          include: {
            buyer: {
              select: { id: true, username: true, email: true }
            },
            seller: {
              select: { id: true, username: true, email: true }
            }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: buyerId,
            walletId: buyerWallet.id,
            type: 'ESCROW_DEPOSIT',
            amount: totalAmount,
            fee: Number(escrow.fee),
            netAmount: Number(escrow.amount),
            currency: escrow.currency,
            status: 'COMPLETED',
            reference: `ESC-DEPOSIT-${escrowId}`,
            description: `Funded escrow: ${escrow.title}`
          }
        });

        return updatedEscrow;
      });

      return {
        success: true,
        message: 'Escrow funded successfully',
        escrow: result
      };
    } catch (error) {
      console.error('Fund escrow error:', error);
      return {
        success: false,
        message: 'Failed to fund escrow',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  async markAsDelivered(escrowId: string, sellerId: string, deliveryNotes?: string): Promise<EscrowResponse> {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      if (escrow.sellerId !== sellerId) {
        return {
          success: false,
          message: 'Only the seller can mark as delivered',
          error: 'UNAUTHORIZED'
        };
      }

      if (escrow.status !== EscrowStatus.FUNDED) {
        return {
          success: false,
          message: 'Escrow must be funded before marking as delivered',
          error: 'INVALID_STATUS'
        };
      }

      const updatedEscrow = await prisma.escrow.update({
        where: { id: escrowId },
        data: { 
          adminNotes: deliveryNotes || 'Marked as delivered by seller'
        },
        include: {
          buyer: {
            select: { id: true, username: true, email: true }
          },
          seller: {
            select: { id: true, username: true, email: true }
          }
        }
      });

      // Send notification to buyer
      await prisma.notification.create({
        data: {
          userId: escrow.buyerId,
          type: NotificationType.ESCROW_UPDATE,
          title: '🎉 Delivery Details Received!',
          message: `${updatedEscrow.seller.username} has provided delivery details for "${updatedEscrow.title}". Check your escrow page to view credentials.`,
          link: `/escrow?id=${escrowId}`,
        }
      });

      return {
        success: true,
        message: 'Marked as delivered successfully. Waiting for buyer confirmation.',
        escrow: updatedEscrow
      };
    } catch (error) {
      console.error('Mark as delivered error:', error);
      return {
        success: false,
        message: 'Failed to mark as delivered',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  async confirmDelivery(escrowId: string, buyerId: string): Promise<EscrowResponse> {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      if (escrow.buyerId !== buyerId) {
        return {
          success: false,
          message: 'Only the buyer can confirm delivery',
          error: 'UNAUTHORIZED'
        };
      }

      if (escrow.status !== EscrowStatus.FUNDED) {
        return {
          success: false,
          message: 'Escrow must be funded before confirming delivery',
          error: 'INVALID_STATUS'
        };
      }

      // Release funds to seller
      const result = await prisma.$transaction(async (tx) => {
        // Add amount to seller's wallet
        const sellerAmount = Number(escrow.amount);
        const sellerWallet = await tx.wallet.findUnique({
          where: { userId_currency: { userId: escrow.sellerId, currency: escrow.currency } }
        });

        if (!sellerWallet) {
          throw new Error('Seller wallet not found');
        }

        await tx.wallet.update({
          where: { userId_currency: { userId: escrow.sellerId, currency: escrow.currency } },
          data: { balance: { increment: sellerAmount } }
        });

        // Update escrow status
        const updatedEscrow = await tx.escrow.update({
          where: { id: escrowId },
          data: { 
            status: EscrowStatus.RELEASED,
            releasedAt: new Date()
          },
          include: {
            buyer: {
              select: { id: true, username: true, email: true }
            },
            seller: {
              select: { id: true, username: true, email: true }
            }
          }
        });

        // Create transaction record for seller
        await tx.transaction.create({
          data: {
            userId: escrow.sellerId,
            walletId: sellerWallet.id,
            type: 'ESCROW_RELEASE',
            amount: sellerAmount,
            fee: 0,
            netAmount: sellerAmount,
            currency: escrow.currency,
            status: 'COMPLETED',
            reference: `ESC-RELEASE-${escrowId}`,
            description: `Escrow released: ${escrow.title}`
          }
        });

        return updatedEscrow;
      });

      return {
        success: true,
        message: 'Delivery confirmed and funds released successfully',
        escrow: result
      };
    } catch (error) {
      console.error('Confirm delivery error:', error);
      return {
        success: false,
        message: 'Failed to confirm delivery',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  async createDispute(escrowId: string, userId: string, reason: string): Promise<EscrowResponse> {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
        return {
          success: false,
          message: 'Only buyer or seller can create a dispute',
          error: 'UNAUTHORIZED'
        };
      }

      if (escrow.status !== EscrowStatus.FUNDED) {
        return {
          success: false,
          message: 'Can only dispute funded escrows',
          error: 'INVALID_STATUS'
        };
      }

      const updatedEscrow = await prisma.escrow.update({
        where: { id: escrowId },
        data: { 
          status: EscrowStatus.DISPUTED,
          disputeReason: reason,
          disputedAt: new Date()
        },
        include: {
          buyer: {
            select: { id: true, username: true, email: true }
          },
          seller: {
            select: { id: true, username: true, email: true }
          }
        }
      });

      return {
        success: true,
        message: 'Dispute created successfully. Admin will review.',
        escrow: updatedEscrow
      };
    } catch (error) {
      console.error('Create dispute error:', error);
      return {
        success: false,
        message: 'Failed to create dispute',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  async cancelEscrow(escrowId: string, userId: string): Promise<EscrowResponse> {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
        return {
          success: false,
          message: 'Only buyer or seller can cancel this escrow',
          error: 'UNAUTHORIZED'
        };
      }

      if (escrow.status === EscrowStatus.RELEASED || escrow.status === EscrowStatus.CANCELLED) {
        return {
          success: false,
          message: 'Cannot cancel completed or already cancelled escrow',
          error: 'INVALID_STATUS'
        };
      }

      // If escrow was funded, refund the buyer
      if (escrow.status === EscrowStatus.FUNDED) {
        const result = await prisma.$transaction(async (tx) => {
          // Refund buyer
          const totalAmount = Number(escrow.amount) + Number(escrow.fee);
          const buyerWalletRefund = await tx.wallet.findUnique({
            where: { userId_currency: { userId: escrow.buyerId, currency: escrow.currency } }
          });

          if (!buyerWalletRefund) {
            throw new Error('Buyer wallet not found for refund');
          }

          await tx.wallet.update({
            where: { userId_currency: { userId: escrow.buyerId, currency: escrow.currency } },
            data: { balance: { increment: totalAmount } }
          });

          // Update escrow status
          const updatedEscrow = await tx.escrow.update({
            where: { id: escrowId },
            data: { 
              status: EscrowStatus.REFUNDED,
              adminNotes: `Cancelled by ${userId === escrow.buyerId ? 'buyer' : 'seller'}`
            },
            include: {
              buyer: {
                select: { id: true, username: true, email: true }
              },
              seller: {
                select: { id: true, username: true, email: true }
              }
            }
          });

          // Create refund transaction record
          await tx.transaction.create({
            data: {
              userId: escrow.buyerId,
              walletId: buyerWalletRefund.id,
              type: 'REFUND',
              amount: totalAmount,
              fee: 0,
              netAmount: totalAmount,
              currency: escrow.currency,
              status: 'COMPLETED',
              reference: `ESC-REFUND-${escrowId}`,
              description: `Escrow refund: ${escrow.title}`
            }
          });

          return updatedEscrow;
        });

        return {
          success: true,
          message: 'Escrow cancelled and funds refunded successfully',
          escrow: result
        };
      } else {
        // Just cancel if not funded
        const updatedEscrow = await prisma.escrow.update({
          where: { id: escrowId },
          data: { 
            status: EscrowStatus.CANCELLED,
            adminNotes: `Cancelled by ${userId === escrow.buyerId ? 'buyer' : 'seller'}`
          },
          include: {
            buyer: {
              select: { id: true, username: true, email: true }
            },
            seller: {
              select: { id: true, username: true, email: true }
            }
          }
        });

        return {
          success: true,
          message: 'Escrow cancelled successfully',
          escrow: updatedEscrow
        };
      }
    } catch (error) {
      console.error('Cancel escrow error:', error);
      return {
        success: false,
        message: 'Failed to cancel escrow',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  async extendDeadline(escrowId: string, userId: string, additionalHours: number): Promise<EscrowResponse> {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId }
      });

      if (!escrow) {
        return {
          success: false,
          message: 'Escrow not found',
          error: 'ESCROW_NOT_FOUND'
        };
      }

      if (escrow.buyerId !== userId && escrow.sellerId !== userId) {
        return {
          success: false,
          message: 'Only buyer or seller can extend deadline',
          error: 'UNAUTHORIZED'
        };
      }

      if (escrow.status !== EscrowStatus.FUNDED) {
        return {
          success: false,
          message: 'Can only extend deadline for funded escrows',
          error: 'INVALID_STATUS'
        };
      }

      const newDeadline = new Date(escrow.autoReleaseAt!.getTime() + additionalHours * 60 * 60 * 1000);

      const updatedEscrow = await prisma.escrow.update({
        where: { id: escrowId },
        data: { autoReleaseAt: newDeadline },
        include: {
          buyer: {
            select: { id: true, username: true, email: true }
          },
          seller: {
            select: { id: true, username: true, email: true }
          }
        }
      });

      return {
        success: true,
        message: `Deadline extended by ${additionalHours} hours`,
        escrow: updatedEscrow
      };
    } catch (error) {
      console.error('Extend deadline error:', error);
      return {
        success: false,
        message: 'Failed to extend deadline',
        error: 'INTERNAL_ERROR'
      };
    }
  }
}

export const escrowService = new EscrowService();