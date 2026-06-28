'use client';

import { useState, useEffect } from 'react';
import { IoNotificationsOutline, IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';
import { pushNotificationService } from '@/services/push-notification.service';
import { useToast } from '@/contexts/ToastContext';

export default function PushNotificationToggle() {
  const { showToast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    setIsLoading(true);
    try {
      // Register service worker first
      await pushNotificationService.registerServiceWorker();
      
      // Check permission
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
      
      // Check if subscribed
      const subscribed = await pushNotificationService.isSubscribed();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        // Unsubscribe
        const success = await pushNotificationService.unsubscribe();
        if (success) {
          setIsSubscribed(false);
          showToast('Push notifications disabled', 'success');
        } else {
          showToast('Failed to disable notifications', 'error');
        }
      } else {
        // Subscribe
        const subscription = await pushNotificationService.subscribe();
        if (subscription) {
          setIsSubscribed(true);
          setPermission('granted');
          showToast('Push notifications enabled! 🔔', 'success');
          
          // Send test notification
          setTimeout(() => {
            pushNotificationService.showLocalNotification(
              'Notifications Enabled',
              'You\'ll now receive push notifications from ClanPlug!'
            );
          }, 1000);
        } else {
          if (Notification.permission === 'denied') {
            showToast('Please enable notifications in your browser settings', 'error');
          } else {
            showToast('Failed to enable notifications', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      showToast('Something went wrong', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/push/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showToast('Test notification sent! Check your device 📱', 'success');
      } else {
        showToast('Failed to send test notification', 'error');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      showToast('Failed to send test notification', 'error');
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2f3336]">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <IoNotificationsOutline className="w-5 h-5 text-blue-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm mb-1">Push Notifications</h3>
          <p className="text-gray-400 text-xs mb-3">
            Get notified instantly about likes, comments, messages, and more on your device
          </p>
          
          {/* Permission Status */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-500 text-xs">Status:</span>
            {permission === 'granted' && isSubscribed ? (
              <div className="flex items-center gap-1 text-green-500">
                <IoCheckmarkCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Enabled</span>
              </div>
            ) : permission === 'denied' ? (
              <div className="flex items-center gap-1 text-red-500">
                <IoCloseCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Blocked</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <IoCloseCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Disabled</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              disabled={isLoading || permission === 'denied'}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isSubscribed
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? '...' : isSubscribed ? 'Disable' : 'Enable'}
            </button>
            
            {isSubscribed && (
              <button
                onClick={sendTestNotification}
                disabled={isLoading}
                className="px-3 py-2 bg-[#262626] hover:bg-[#363636] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Test
              </button>
            )}
          </div>

          {permission === 'denied' && (
            <p className="text-red-400 text-[10px] mt-2">
              Notifications are blocked. Enable them in your browser settings to receive push notifications.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
