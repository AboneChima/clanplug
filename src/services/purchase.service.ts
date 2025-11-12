import { prisma } from '../config/database';
import { PurchaseStatus, ListingStatus, EscrowStatus, Currency } from '@prisma/client';
import { escrowService } from './escrow.service';
import { listingService } from './listing.service';
import { notificationService } from './notification.service';

export interface InitiatePurchaseRequest {
  listingId: string;
  buyerId: string;
}

export interface DeliverAccountRequest {
  purchaseId: string;
  sellerId: string;
  accountDetails: {
    username: string;
    password: string;
    email?: string;
    additionalInfo?: string;
  };
}

class PurchaseService {
  // Initiate purchase (creates escrow)
  async initiatePurchase(data: InitiatePurchaseRequest) {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id: data.listingId },
        include: { seller: true },
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      if (listing.status !== ListingStatus.ACTIVE) {
        throw new Error('Listing is not available for purchase');
      }

      if (listing.sellerId === data.buyerId) {
        throw new Error('Cannot purchase your own listing');
      }

      // Create escrow
      const escrowResult = await escrowService.createEscrow({
        buyerId: data.buyerId,
        sellerId: listing.sellerId,
        amount: Number(listing.price),
        currency: listing.currency,
        title: `Purchase: ${listing.title}`,
        description: `Escrow for purchasing ${listing.type} - ${listing.title}`,
        terms: 'Seller must deliver account details within 24 hours. Buyer has 48 hours to verify and confirm delivery.',
      });

      if (!escrowResult.success || !escrowResult.escrow) {
        throw new Error(escrowResult.message || 'Failed to create escrow');
      }

      // Create purchase record
      const purchase = await prisma.purchase.create({
        data: {
          listingId: data.listingId,
          buyerId: data.buyerId,
          sellerId: listing.sellerId,
          amount: listing.price,
          currency: listing.currency,
          escrowId: escrowResult.escrow.id,
          status: PurchaseStatus.IN_ESCROW,
        },
        include: {
          listing: true,
          buyer: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          escrow: true,
        },
      });

      // Notify seller
      await notificationService.createNotification({
        userId: listing.sellerId,
        type: 'TRANSACTION',
        title: 'New Purchase',
        message: `${purchase.buyer.username} purchased your listing: ${listing.title}`,
        data: { purchaseId: purchase.id, listingId: listing.id },
      });

      return { success: true, purchase };
    } catch (error: any) {
      console.error('Error initiating purchase:', error);
      throw error;
    }
  }

  // Deliver account details (seller)
  async deliverAccount(data: DeliverAccountRequest) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { id: data.purchaseId },
        include: { listing: true, buyer: true },
      });

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      if (purchase.sellerId !== data.sellerId) {
        throw new Error('Unauthorized to deliver this purchase');
      }

      if (purchase.status !== PurchaseStatus.IN_ESCROW) {
        throw new Error('Purchase is not in escrow status');
      }

      // Update purchase with account details
      const updated = await prisma.purchase.update({
        where: { id: data.purchaseId },
        data: {
          accountDetails: data.accountDetails,
          deliveredAt: new Date(),
          status: PurchaseStatus.DELIVERED,
        },
        include: {
          listing: true,
          buyer: true,
          seller: true,
        },
      });

      // Notify buyer
      await notificationService.createNotification({
        userId: purchase.buyerId,
        type: 'TRANSACTION',
        title: 'Account Delivered',
        message: `Seller has delivered the account details for: ${purchase.listing.title}`,
        data: { purchaseId: purchase.id },
      });

      return { success: true, purchase: updated };
    } catch (error: any) {
      console.error('Error delivering account:', error);
      throw error;
    }
  }

  // Confirm delivery (buyer)
  async confirmDelivery(purchaseId: string, buyerId: string) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        include: { listing: true, escrow: true, seller: true },
      });

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      if (purchase.buyerId !== buyerId) {
        throw new Error('Unauthorized to confirm this purchase');
      }

      if (purchase.status !== PurchaseStatus.DELIVERED) {
        throw new Error('Account has not been delivered yet');
      }

      if (!purchase.escrowId) {
        throw new Error('No escrow found for this purchase');
      }

      // Release escrow funds to seller via buyer confirmation
      const escrowResult = await escrowService.confirmDelivery(purchase.escrowId, buyerId);

      if (!escrowResult.success) {
        throw new Error(escrowResult.message || 'Failed to release escrow');
      }

      // Update purchase status
      const updated = await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: PurchaseStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Mark listing as sold
      await listingService.markAsSold(purchase.listingId, purchaseId);

      // Notify seller
      await notificationService.createNotification({
        userId: purchase.sellerId,
        type: 'TRANSACTION',
        title: 'Purchase Completed',
        message: `Buyer confirmed delivery for: ${purchase.listing.title}. Funds released!`,
        data: { purchaseId: purchase.id },
      });

      return { success: true, purchase: updated };
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      throw error;
    }
  }
}

export const purchaseService = new PurchaseService();