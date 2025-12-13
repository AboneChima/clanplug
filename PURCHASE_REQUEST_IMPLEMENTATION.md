# Purchase Request System - Implementation Guide

## ✅ Step 1: Database Schema (DONE)

Added `PurchaseRequest` model with:
- Status tracking (PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED)
- Expiration time (5 minutes)
- Relations to buyer, seller, and post
- FCM tokens array in User model for push notifications

## Step 2: Push Notifications Setup

### Install Firebase Admin SDK
```bash
npm install firebase-admin
```

### Create Firebase Service
File: `src/services/firebase.service.ts`

```typescript
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const sendPushNotification = async (
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  if (!fcmTokens || fcmTokens.length === 0) return;

  const message = {
    notification: {
      title,
      body
    },
    data: data || {},
    tokens: fcmTokens,
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        channelId: 'purchase_requests'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log('Push notification sent:', response.successCount);
    return response;
  } catch (error) {
    console.error('Push notification error:', error);
    throw error;
  }
};
```

### Environment Variable
Add to `.env`:
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

## Step 3: Purchase Request Service

File: `src/services/purchaseRequest.service.ts`

```typescript
import { prisma } from '../config/database';
import { sendPushNotification } from './firebase.service';

export const purchaseRequestService = {
  // Create purchase request
  async create(buyerId: string, sellerId: string, postId: string, amount: number, currency: string) {
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

    // Create request (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
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
        buyer: true,
        seller: true,
        post: true
      }
    });

    // Send push notification to seller
    if (request.seller.fcmTokens && request.seller.fcmTokens.length > 0) {
      await sendPushNotification(
        request.seller.fcmTokens,
        '💰 New Purchase Request!',
        `${request.buyer.username} wants to buy "${request.post.title}" for ${amount} ${currency}`,
        {
          type: 'PURCHASE_REQUEST',
          requestId: request.id,
          postId: request.postId
        }
      );
    }

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: sellerId,
        type: 'PURCHASE_REQUEST',
        title: '💰 New Purchase Request!',
        message: `${request.buyer.username} wants to buy "${request.post.title}" for ${amount} ${currency}. Respond within 5 minutes!`,
        data: {
          requestId: request.id,
          postId: request.postId,
          buyerId: request.buyerId
        }
      }
    });

    return request;
  },

  // Seller accepts request
  async accept(requestId: string, sellerId: string) {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: { buyer: true, seller: true, post: true }
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

    // Notify buyer
    if (request.buyer.fcmTokens && request.buyer.fcmTokens.length > 0) {
      await sendPushNotification(
        request.buyer.fcmTokens,
        '✅ Seller Accepted!',
        `${request.seller.username} accepted your request. Proceed to payment.`,
        {
          type: 'REQUEST_ACCEPTED',
          requestId: request.id,
          postId: request.postId
        }
      );
    }

    await prisma.notification.create({
      data: {
        userId: request.buyerId,
        type: 'PURCHASE_REQUEST',
        title: '✅ Seller Accepted!',
        message: `${request.seller.username} accepted your request for "${request.post.title}". Proceed to payment.`,
        data: {
          requestId: request.id,
          postId: request.postId
        }
      }
    });

    return request;
  },

  // Seller rejects request
  async reject(requestId: string, sellerId: string) {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      include: { buyer: true, seller: true, post: true }
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
        `${request.seller.username} declined your request for "${request.post.title}".`,
        {
          type: 'REQUEST_REJECTED',
          requestId: request.id
        }
      );
    }

    await prisma.notification.create({
      data: {
        userId: request.buyerId,
        type: 'PURCHASE_REQUEST',
        title: '❌ Request Declined',
        message: `${request.seller.username} declined your request for "${request.post.title}".`,
        data: {
          requestId: request.id
        }
      }
    });

    return request;
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
      include: { buyer: true, post: true }
    });

    for (const request of expired) {
      await prisma.purchaseRequest.update({
        where: { id: request.id },
        data: { status: 'EXPIRED' }
      });

      // Notify buyer
      await prisma.notification.create({
        data: {
          userId: request.buyerId,
          type: 'PURCHASE_REQUEST',
          title: '⏰ Request Expired',
          message: `Your request for "${request.post.title}" expired. The seller didn't respond in time.`,
          data: {
            requestId: request.id
          }
        }
      });
    }

    return expired.length;
  }
};
```

## Step 4: API Routes

File: `src/routes/purchaseRequest.routes.ts`

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { purchaseRequestService } from '../services/purchaseRequest.service';

const router = Router();

// POST /api/purchase-requests - Create request
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { sellerId, postId, amount, currency } = req.body;
  const buyerId = req.user!.id;

  const request = await purchaseRequestService.create(
    buyerId,
    sellerId,
    postId,
    amount,
    currency
  );

  res.json({
    success: true,
    message: 'Purchase request sent to seller',
    data: request
  });
}));

// POST /api/purchase-requests/:id/accept - Seller accepts
router.post('/:id/accept', authenticate, asyncHandler(async (req, res) => {
  const sellerId = req.user!.id;
  const request = await purchaseRequestService.accept(req.params.id, sellerId);

  res.json({
    success: true,
    message: 'Request accepted',
    data: request
  });
}));

// POST /api/purchase-requests/:id/reject - Seller rejects
router.post('/:id/reject', authenticate, asyncHandler(async (req, res) => {
  const sellerId = req.user!.id;
  const request = await purchaseRequestService.reject(req.params.id, sellerId);

  res.json({
    success: true,
    message: 'Request rejected',
    data: request
  });
}));

// GET /api/purchase-requests - Get user's requests
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  
  const requests = await prisma.purchaseRequest.findMany({
    where: {
      OR: [
        { buyerId: userId },
        { sellerId: userId }
      ]
    },
    include: {
      buyer: true,
      seller: true,
      post: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: requests
  });
}));

export default router;
```

## Step 5: Frontend - Orders Page

File: `web/src/app/orders/page.tsx`

Shows:
- Pending purchase requests (as buyer)
- Incoming requests (as seller)
- Active escrows
- Completed orders

## Step 6: Cron Job for Expiring Requests

File: `src/jobs/expireRequests.ts`

```typescript
import cron from 'node-cron';
import { purchaseRequestService } from '../services/purchaseRequest.service';

// Run every minute
export const startExpirationJob = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const expired = await purchaseRequestService.expireOldRequests();
      if (expired > 0) {
        console.log(`Expired ${expired} purchase requests`);
      }
    } catch (error) {
      console.error('Error expiring requests:', error);
    }
  });
};
```

## Next Steps:

1. Run migration: `npx prisma migrate dev --name add_purchase_requests`
2. Install Firebase Admin SDK
3. Get Firebase service account JSON from Firebase Console
4. Implement the services and routes
5. Create Orders page in frontend
6. Add FCM token registration in mobile app
7. Test the complete flow

This is the professional way to handle marketplace purchases!
