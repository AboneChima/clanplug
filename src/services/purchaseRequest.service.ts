import { prisma } from '../config/database';
import { sendPushNotification } from './firebase.service';
import { Currency } from '@prisma/client';

export const purchaseRequestService = {
  // Create purchase request
  async create(buyerId: string, sellerId: string, postId: string, amount: number, currency: Currency) {
    // Validate users
    if (buyerId === sellerId) {
      throw new Error('You cannot buy your own listing');
    }

    // Check if buyer already has pending request for this post
    const existing = await prisma.purchaseRequest.findFirst({
      where: {
        buyerId,
        postId,
        status: 'PENDING_SELLER_RESPONSE'
      }
    });

    if (existing) {
      throw new Error('You already have a pending request for this listing');
    }

    // Get post and seller info
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true }
    });

    if (!post) throw new Error('Listing not found');
    if (post.userId !== sellerId) throw new Error('Invalid seller');
    if (post.status === 'SOLD') throw new Error('This listing is already sold');

    const buyer = await prisma.user.findUnique({
      where: { id: buyerId }
    });

    if (!buyer) throw new Error('Buyer not found');

    // Create request (expires in 30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    const request = await prisma.purchaseRequest.create({
      data: {
        buyerId,
        sellerId,
        postId,
        amount,
        currency,
        expiresAt
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            fcmTokens: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            images: true
          }
        }
      }
    });

    // Send push notification to seller
    if (request.seller.fcmTokens && request.seller.fcmTokens.length > 0) {
      await sendPushNotification(
        request.seller.fcmTokens,
        '💰 New Purchase Request!',
        `${request.buyer.firstName} ${request.buyer.lastName} wants to buy "${request.post.title}" for ${amount} ${currency}`,
        {
          type: 'PURCHASE_REQUEST',
          requestId: request.id,
          postId: request.postId,
          buyerId: request.buyerId
        }
      );
    }

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: sellerId,
        type: 'PURCHASE_REQUEST',
        title: '💰 New Purchase Request!',
        message: `${request.buyer.firstName} ${request.buyer.lastName} wants to buy "${request.post.title}" for ${amount} ${currency}. Respond within 30 minutes!`,
        data: {
          requestId: request.id,
          postId: request.postId,
          buyerId: request.buyerId,
          amount: amount.toString(),
          currency
        }
      }
    });

    return request;
  },

  // Seller accepts request
  async accept(requestId: string, sellerId: string) {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            fcmTokens: true
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true
          }
        }
      }
    });

    if (!request) throw new Error('Request not found');
    if (request.sellerId !== sellerId) throw new Error('Unauthorized');
    if (request.status !== 'PENDING_SELLER_RESPONSE') throw new Error('Request already processed');
    if (new Date() > request.expiresAt) throw new Error('Request expired');

    // Update request
    await prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      }
    });

    // Notify buyer with push
    if (request.buyer.fcmTokens && request.buyer.fcmTokens.length > 0) {
      await sendPushNotification(
        request.buyer.fcmTokens,
        '✅ Seller Accepted!',
        `${request.seller.firstName} ${request.seller.lastName} accepted your request. Proceed to payment now.`,
        {
          type: 'REQUEST_ACCEPTED',
          requestId: request.id,
          postId: request.postId,
          sellerId: request.sellerId
        }
      );
    }

    // In-app notification
    await prisma.notification.create({
      data: {
        userId: request.buyerId,
        type: 'PURCHASE_REQUEST',
        title: '✅ Seller Accepted!',
        message: `${request.seller.firstName} ${request.seller.lastName} accepted your request for "${request.post.title}". Proceed to payment now!`,
        data: {
          requestId: request.id,
          postId: request.postId,
          sellerId: request.sellerId
        }
      }
    });

    return request;
  },

  // Seller rejects request
  async reject(requestId: string, sellerId: string, reason?: string) {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            fcmTokens: true
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!request) throw new Error('Request not found');
    if (request.sellerId !== sellerId) throw new Error('Unauthorized');
    if (request.status !== 'PENDING_SELLER_RESPONSE') throw new Error('Request already processed');

    await prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date()
      }
    });

    // Notify buyer
    if (request.buyer.fcmTokens && request.buyer.fcmTokens.length > 0) {
      await sendPushNotification(
        request.buyer.fcmTokens,
        '❌ Request Declined',
        `${request.seller.firstName} ${request.seller.lastName} declined your request for "${request.post.title}".`,
        {
          type: 'REQUEST_REJECTED',
          requestId: request.id,
          postId: request.postId
        }
      );
    }

    await prisma.notification.create({
      data: {
        userId: request.buyerId,
        type: 'PURCHASE_REQUEST',
        title: '❌ Request Declined',
        message: `${request.seller.firstName} ${request.seller.lastName} declined your request for "${request.post.title}". ${reason || 'Try another listing.'}`,
        data: {
          requestId: request.id,
          postId: request.postId
        }
      }
    });

    return request;
  },

  // Buyer cancels request
  async cancel(requestId: string, buyerId: string) {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) throw new Error('Request not found');
    if (request.buyerId !== buyerId) throw new Error('Unauthorized');
    if (request.status !== 'PENDING_SELLER_RESPONSE') throw new Error('Request already processed');

    await prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    return request;
  },

  // Get user's requests
  async getUserRequests(userId: string) {
    const requests = await prisma.purchaseRequest.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            images: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return requests;
  },

  // Expire old requests (cron job)
  async expireOldRequests() {
    const expired = await prisma.purchaseRequest.findMany({
      where: {
        status: 'PENDING_SELLER_RESPONSE',
        expiresAt: {
          lt: new Date()
        }
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            fcmTokens: true
          }
        },
        seller: {
          select: {
            username: true
          }
        },
        post: {
          select: {
            title: true
          }
        }
      }
    });

    for (const request of expired) {
      await prisma.purchaseRequest.update({
        where: { id: request.id },
        data: { status: 'EXPIRED' }
      });

      // Notify buyer
      if (request.buyer.fcmTokens && request.buyer.fcmTokens.length > 0) {
        await sendPushNotification(
          request.buyer.fcmTokens,
          '⏰ Request Expired',
          `Your request for "${request.post.title}" expired. The seller didn't respond in time.`,
          {
            type: 'REQUEST_EXPIRED',
            requestId: request.id
          }
        );
      }

      await prisma.notification.create({
        data: {
          userId: request.buyerId,
          type: 'PURCHASE_REQUEST',
          title: '⏰ Request Expired',
          message: `Your request for "${request.post.title}" expired. ${request.seller.username} didn't respond in time. Try another listing.`,
          data: {
            requestId: request.id
          }
        }
      });
    }

    if (expired.length > 0) {
      console.log(`⏰ Expired ${expired.length} purchase requests`);
    }

    return expired.length;
  }
};
