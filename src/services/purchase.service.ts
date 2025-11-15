import { prisma } from '../config/database';
import { Currency, PurchaseStatus, TransactionType, TransactionStatus } from '@prisma/client';
import { notificationService } from './notification.service';

class PurchaseService {
  // Calculate 3% platform fee for sales
  private calculatePlatformFee(amount: number): number {
    return Math.round(amount * 0.03 * 100) / 100; // 3% fee
  }

  // Create a purchase (buyer initiates purchase)
  async createPurchase(buyerId: string, listingId: string) {
    try {
      // Get listing details
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!listing) {
        return { success: false, message: 'Listing not found', error: 'LISTING_NOT_FOUND' };
      }

      if (listing.status !== 'ACTIVE') {
        return { success: false, message: 'Listing is not available', error: 'LISTING_NOT_AVAILABLE' };
      }

      if (listing.sellerId === buyerId) {
        return { success: false, message: 'Cannot purchase your own listing', error: 'CANNOT_BUY_OWN_LISTING' };
      }

      // Check buyer's wallet balance
      const buyerWallet = await prisma.wallet.findUnique({
        where: { userId_currency: { userId: buyerId, currency: listing.currency } },
      });

      if (!buyerWallet) {
        return { success: false, message: 'Wallet not found', error: 'WALLET_NOT_FOUND' };
      }

      const platformFee = this.calculatePlatformFee(Number(listing.price));
      const totalAmount = Number(listing.price) + platformFee;

      if (Number(buyerWallet.balance) < totalAmount) {
        return {
          success: false,
          message: `Insufficient balance. Required: ${totalAmount} ${listing.currency} (includes 3% platform fee)`,
          error: 'INSUFFICIENT_BALANCE',
        };
      }

      // Create purchase and deduct from buyer's wallet
      const result = await prisma.$transaction(async (tx) => {
        // Deduct from buyer's wallet (listing price + platform fee)
        await tx.wallet.update({
          where: { userId_currency: { userId: buyerId, currency: listing.currency } },
          data: { balance: { decrement: totalAmount } },
        });

        // Create purchase record
        const purchase = await tx.purchase.create({
          data: {
            listingId,
            buyerId,
            sellerId: listing.sellerId,
            amount: listing.price,
            currency: listing.currency,
            status: PurchaseStatus.PAYMENT_CONFIRMED,
          },
          include: {
            listing: true,
            buyer: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            seller: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Create transaction record for buyer (PURCHASE)
        await tx.transaction.create({
          data: {
            userId: buyerId,
            walletId: buyerWallet.id,
            type: TransactionType.PURCHASE,
            status: TransactionStatus.COMPLETED,
            amount: totalAmount,
            fee: platformFee,
            netAmount: Number(listing.price),
            currency: listing.currency,
            reference: `PURCHASE-${purchase.id}`,
            description: `Purchased: ${listing.title}`,
            metadata: {
              purchaseId: purchase.id,
              listingId: listing.id,
              sellerId: listing.sellerId,
              platformFee,
            },
          },
        });

        // Create transaction record for platform fee
        await tx.transaction.create({
          data: {
            userId: buyerId,
            walletId: buyerWallet.id,
            type: TransactionType.FEE_CHARGE,
            status: TransactionStatus.COMPLETED,
            amount: platformFee,
            fee: 0,
            netAmount: platformFee,
            currency: listing.currency,
            reference: `FEE-${purchase.id}`,
            description: `Platform fee (3%) for: ${listing.title}`,
            metadata: {
              purchaseId: purchase.id,
              listingId: listing.id,
              feePercentage: 3,
            },
          },
        });

        // Update listing status to SOLD
        await tx.listing.update({
          where: { id: listingId },
          data: { status: 'SOLD' },
        });

        return purchase;
      });

      // Send notifications
      try {
        // Notify buyer
        await notificationService.createNotification({
          userId: buyerId,
          type: 'TRANSACTION',
          title: 'Purchase Successful',
          message: `You purchased "${listing.title}" for ${listing.currency} ${listing.price}. Seller will deliver soon.`,
          data: {
            purchaseId: result.id,
            listingId: listing.id,
            amount: Number(listing.price),
            currency: listing.currency,
          },
        });

        // Notify seller
        await notificationService.createNotification({
          userId: listing.sellerId,
          type: 'TRANSACTION',
          title: 'New Sale!',
          message: `Your listing "${listing.title}" was purchased. Please deliver the account details.`,
          data: {
            purchaseId: result.id,
            listingId: listing.id,
            amount: Number(listing.price),
            currency: listing.currency,
          },
        });
      } catch (notificationError) {
        console.error('Failed to send purchase notifications:', notificationError);
      }

      return {
        success: true,
        message: 'Purchase successful! Waiting for seller to deliver.',
        purchase: result,
      };
    } catch (error: any) {
      console.error('Create purchase error:', error);
      return {
        success: false,
        message: 'Failed to create purchase',
        error: error.message || 'INTERNAL_ERROR',
      };
    }
  }

  // Seller delivers the account (marks as delivered)
  async deliverPurchase(purchaseId: string, sellerId: string, accountDetails: any) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: {
          listing: true,
          buyer: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      if (!purchase) {
        return { success: false, message: 'Purchase not found', error: 'PURCHASE_NOT_FOUND' };
      }

      if (purchase.sellerId !== sellerId) {
        return { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' };
      }

      if (purchase.status !== PurchaseStatus.PAYMENT_CONFIRMED) {
        return { success: false, message: 'Purchase is not in correct status', error: 'INVALID_STATUS' };
      }

      // Update purchase with account details
      const updatedPurchase = await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: PurchaseStatus.DELIVERED,
          accountDetails, // Store encrypted account credentials
          deliveredAt: new Date(),
        },
        include: {
          listing: true,
          buyer: {
            select: { id: true, username: true, email: true },
          },
          seller: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      // Notify buyer
      try {
        await notificationService.createNotification({
          userId: purchase.buyerId,
          type: 'TRANSACTION',
          title: 'Account Delivered',
          message: `Seller has delivered your account for "${purchase.listing.title}". Please confirm receipt.`,
          data: {
            purchaseId: purchase.id,
            listingId: purchase.listingId,
          },
        });
      } catch (notificationError) {
        console.error('Failed to send delivery notification:', notificationError);
      }

      return {
        success: true,
        message: 'Account delivered successfully',
        purchase: updatedPurchase,
      };
    } catch (error: any) {
      console.error('Deliver purchase error:', error);
      return {
        success: false,
        message: 'Failed to deliver purchase',
        error: error.message || 'INTERNAL_ERROR',
      };
    }
  }

  // Buyer confirms receipt and releases payment to seller
  async confirmPurchase(purchaseId: string, buyerId: string, rating?: number, review?: string) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: {
          listing: true,
          seller: {
            select: { id: true, username: true, email: true },
          },
        },
      });

      if (!purchase) {
        return { success: false, message: 'Purchase not found', error: 'PURCHASE_NOT_FOUND' };
      }

      if (purchase.buyerId !== buyerId) {
        return { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' };
      }

      if (purchase.status !== PurchaseStatus.DELIVERED) {
        return { success: false, message: 'Purchase has not been delivered yet', error: 'NOT_DELIVERED' };
      }

      // Release payment to seller (listing price minus 3% platform fee)
      const platformFee = this.calculatePlatformFee(Number(purchase.amount));
      const sellerAmount = Number(purchase.amount) - platformFee;

      const result = await prisma.$transaction(async (tx) => {
        // Get seller's wallet
        const sellerWallet = await tx.wallet.findUnique({
          where: { userId_currency: { userId: purchase.sellerId, currency: purchase.currency } },
        });

        if (!sellerWallet) {
          throw new Error('Seller wallet not found');
        }

        // Credit seller's wallet (amount minus platform fee)
        await tx.wallet.update({
          where: { userId_currency: { userId: purchase.sellerId, currency: purchase.currency } },
          data: { balance: { increment: sellerAmount } },
        });

        // Create transaction record for seller (SALE)
        await tx.transaction.create({
          data: {
            userId: purchase.sellerId,
            walletId: sellerWallet.id,
            type: TransactionType.SALE,
            status: TransactionStatus.COMPLETED,
            amount: Number(purchase.amount),
            fee: platformFee,
            netAmount: sellerAmount,
            currency: purchase.currency,
            reference: `SALE-${purchase.id}`,
            description: `Sale: ${purchase.listing.title}`,
            metadata: {
              purchaseId: purchase.id,
              listingId: purchase.listingId,
              buyerId: purchase.buyerId,
              platformFee,
            },
          },
        });

        // Update purchase status
        const updatedPurchase = await tx.purchase.update({
          where: { id: purchaseId },
          data: {
            status: PurchaseStatus.COMPLETED,
            completedAt: new Date(),
            buyerRating: rating,
            buyerReview: review,
          },
          include: {
            listing: true,
            buyer: {
              select: { id: true, username: true, email: true },
            },
            seller: {
              select: { id: true, username: true, email: true },
            },
          },
        });

        return updatedPurchase;
      });

      // Notify seller
      try {
        await notificationService.createNotification({
          userId: purchase.sellerId,
          type: 'TRANSACTION',
          title: 'Payment Released',
          message: `Buyer confirmed receipt. You received ${purchase.currency} ${sellerAmount} (after 3% platform fee).`,
          data: {
            purchaseId: purchase.id,
            listingId: purchase.listingId,
            amount: sellerAmount,
            currency: purchase.currency,
          },
        });
      } catch (notificationError) {
        console.error('Failed to send payment release notification:', notificationError);
      }

      return {
        success: true,
        message: 'Purchase confirmed and payment released to seller',
        purchase: result,
      };
    } catch (error: any) {
      console.error('Confirm purchase error:', error);
      return {
        success: false,
        message: 'Failed to confirm purchase',
        error: error.message || 'INTERNAL_ERROR',
      };
    }
  }

  // Get user's purchases (as buyer)
  async getUserPurchases(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [purchases, total] = await Promise.all([
        prisma.purchase.findMany({
          where: { buyerId: userId },
          include: {
            listing: true,
            seller: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.purchase.count({ where: { buyerId: userId } }),
      ]);

      return {
        success: true,
        purchases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Get user purchases error:', error);
      return {
        success: false,
        message: 'Failed to get purchases',
        error: error.message || 'INTERNAL_ERROR',
      };
    }
  }

  // Get user's sales (as seller)
  async getUserSales(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [sales, total] = await Promise.all([
        prisma.purchase.findMany({
          where: { sellerId: userId },
          include: {
            listing: true,
            buyer: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.purchase.count({ where: { sellerId: userId } }),
      ]);

      return {
        success: true,
        sales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Get user sales error:', error);
      return {
        success: false,
        message: 'Failed to get sales',
        error: error.message || 'INTERNAL_ERROR',
      };
    }
  }

  // Get purchase by ID
  async getPurchaseById(purchaseId: string, userId: string) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: {
          listing: true,
          buyer: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      if (!purchase) {
        return { success: false, message: 'Purchase not found', error: 'PURCHASE_NOT_FOUND' };
      }

      // Check if user is buyer or seller
      if (purchase.buyerId !== userId && purchase.sellerId !== userId) {
        return { success: false, message: 'Unauthorized', error: 'UNAUTHORIZED' };
      }

      return {
        success: true,
        purchase,
      };
    } catch (error: any) {
      console.error('Get purchase error:', error);
      return {
        success: false,
        message: 'Failed to get purchase',
        error: error.message || 'INTERNAL_ERROR',
      };
    }
  }
}

export const purchaseService = new PurchaseService();
