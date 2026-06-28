// Push Notification Service for Frontend
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered');
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('📢 Notification permission:', permission);
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      console.error('No service worker registration');
      return null;
    }

    try {
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return null;
      }

      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any
        });
        console.log('✅ New push subscription created');
      } else {
        console.log('✅ Already subscribed');
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        console.log('✅ Unsubscribed from push notifications');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  // Check if subscribed
  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      return false;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return subscription !== null;
  }

  // Send subscription to backend
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const token = localStorage.getItem('accessToken');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription.toJSON())
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('✅ Subscription sent to server');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  // Remove subscription from backend
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    const token = localStorage.getItem('accessToken');
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      console.log('✅ Subscription removed from server');
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  // Convert VAPID key from base64 to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array;
  }

  // Show local notification (for testing)
  async showLocalNotification(title: string, body: string): Promise<void> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      console.error('No service worker registration');
      return;
    }

    const permission = await this.requestPermission();
    
    if (permission === 'granted') {
      await this.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true, // Keep visible until user clicks
        vibrate: [200, 100, 200, 100, 200],
        silent: false, // Play sound
        timestamp: Date.now(),
      } as NotificationOptions);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
