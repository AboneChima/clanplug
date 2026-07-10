import webpush from 'web-push';
import { prisma } from '../config/database';

// VAPID keys configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@clanplug.site';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushService {
  // Save push subscription to database
  async saveSubscription(userId: string, subscription: PushSubscriptionData) {
    try {
      // Check if subscription already exists
      const existing = await prisma.pushSubscription.findFirst({
        where: {
          userId,
          endpoint: subscription.endpoint
        }
      });

      if (existing) {
        // Update existing subscription
        await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          }
        });
        console.log('✅ Updated push subscription for user:', userId);
      } else {
        // Create new subscription
        await prisma.pushSubscription.create({
          data: {
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          }
        });
        console.log('✅ Created new push subscription for user:', userId);
      }

      return { success: true, message: 'Subscription saved successfully' };
    } catch (error) {
      console.error('Error saving push subscription:', error);
      return { success: false, message: 'Failed to save subscription' };
    }
  }

  // Remove push subscription
  async removeSubscription(userId: string, endpoint: string) {
    try {
      await prisma.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint
        }
      });

      console.log('✅ Removed push subscription for user:', userId);
      return { success: true, message: 'Subscription removed successfully' };
    } catch (error) {
      console.error('Error removing push subscription:', error);
      return { success: false, message: 'Failed to remove subscription' };
    }
  }

  // Send push notification to a user
  async sendNotificationToUser(userId: string, payload: {
    title: string;
    message: string;
    url?: string;
    tag?: string;
    icon?: string;
  }) {
    try {
      console.log('🔔 Attempting to send push notification to user:', userId);
      
      // Get all subscriptions for this user
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      console.log(`📊 Found ${subscriptions.length} subscription(s) for user`);

      if (subscriptions.length === 0) {
        console.log('ℹ️ No push subscriptions found for user:', userId);
        return { success: false, message: 'No subscriptions found' };
      }

      // Use provided icon or fallback to favicon
      const notificationIcon = payload.icon || '/favicon.ico';
      
      // Determine if notification should be persistent based on type
      const shouldRequireInteraction = payload.tag === 'transaction' || payload.tag === 'escrow';
      
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.message,
        message: payload.message,
        url: payload.url || '/',
        tag: payload.tag || 'notification',
        icon: notificationIcon,
        badge: '/favicon.ico',
        requireInteraction: shouldRequireInteraction, // Only for important notifications
        silent: false, // Play notification sound
        vibrate: [200, 100, 200], // Shorter vibration
        timestamp: Date.now(),
        renotify: false, // Don't re-alert for same tag
      });

      console.log('📦 Notification payload:', notificationPayload);

      // Send to all subscriptions
      let successCount = 0;
      let errorCount = 0;

      const promises = subscriptions.map(async (sub) => {
        try {
          console.log('📤 Sending to endpoint:', sub.endpoint.slice(0, 60) + '...');
          
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            notificationPayload
          );
          
          successCount++;
          console.log('✅ Push notification sent successfully');
        } catch (error: any) {
          errorCount++;
          console.error('❌ Failed to send push notification:', error.message);
          console.error('❌ Error details:', error);
          
          // If subscription is invalid (410 Gone), remove it
          if (error.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
            console.log('🗑️ Removed invalid subscription');
          }
        }
      });

      await Promise.all(promises);
      
      console.log(`📊 Push notification results: ${successCount} success, ${errorCount} errors`);
      
      return { 
        success: successCount > 0, 
        message: `Sent to ${successCount} device(s)`,
        details: { successCount, errorCount }
      };
    } catch (error) {
      console.error('❌ Error in sendNotificationToUser:', error);
      return { success: false, message: 'Failed to send notification' };
    }
  }

  // Send to multiple users
  async sendNotificationToUsers(userIds: string[], payload: {
    title: string;
    message: string;
    url?: string;
    tag?: string;
  }) {
    const promises = userIds.map(userId => 
      this.sendNotificationToUser(userId, payload)
    );
    await Promise.all(promises);
  }
}

export const pushService = new PushService();
