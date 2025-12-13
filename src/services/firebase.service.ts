import * as admin from 'firebase-admin';

let firebaseInitialized = false;

// Initialize Firebase Admin (only once)
export const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      console.warn('⚠️ Firebase service account not configured. Push notifications disabled.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount))
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
};

export const sendPushNotification = async (
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  if (!firebaseInitialized) {
    console.log('📱 Push notification skipped (Firebase not initialized)');
    return null;
  }

  if (!fcmTokens || fcmTokens.length === 0) {
    console.log('📱 No FCM tokens to send to');
    return null;
  }

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
        channelId: 'purchase_requests',
        priority: 'high' as const
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          alert: {
            title,
            body
          }
        }
      }
    }
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ Push notification sent: ${response.successCount}/${fcmTokens.length} successful`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${idx}:`, resp.error);
        }
      });
    }
    
    return response;
  } catch (error) {
    console.error('❌ Push notification error:', error);
    return null;
  }
};

// Register FCM token for user
export const registerFCMToken = async (userId: string, token: string) => {
  const { prisma } = await import('../config/database');
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true }
    });

    if (!user) throw new Error('User not found');

    // Add token if not already present
    const tokens = user.fcmTokens || [];
    if (!tokens.includes(token)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          fcmTokens: [...tokens, token]
        }
      });
      console.log(`✅ FCM token registered for user ${userId}`);
    }

    return true;
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return false;
  }
};

// Remove FCM token
export const unregisterFCMToken = async (userId: string, token: string) => {
  const { prisma } = await import('../config/database');
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true }
    });

    if (!user) throw new Error('User not found');

    const tokens = (user.fcmTokens || []).filter(t => t !== token);
    
    await prisma.user.update({
      where: { id: userId },
      data: { fcmTokens: tokens }
    });

    console.log(`✅ FCM token removed for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    return false;
  }
};
