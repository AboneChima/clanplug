'use client';

import { useEffect, useState } from 'react';
import { IoCloseOutline, IoInformationCircleOutline, IoArrowForwardOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  data?: {
    actionButton?: {
      text: string;
      link: string;
    };
  };
}

export default function BroadcastOverlay() {
  const router = useRouter();
  const [message, setMessage] = useState<BroadcastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    checkForBroadcast();
    
    // Check every 10 seconds for new broadcasts
    const interval = setInterval(checkForBroadcast, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const checkForBroadcast = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Get latest unread SYSTEM notifications (broadcasts)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const notifications = data.data || [];
        
        // Find the latest unread SYSTEM notification
        const latestBroadcast = notifications.find((n: any) => 
          n.type === 'SYSTEM' && !n.isRead
        );

        if (latestBroadcast) {
          // Check if we've already shown this broadcast
          const shownBroadcasts = JSON.parse(localStorage.getItem('shownBroadcasts') || '[]');
          
          if (!shownBroadcasts.includes(latestBroadcast.id)) {
            console.log('📢 Showing broadcast:', latestBroadcast);
            console.log('📢 Action button data:', latestBroadcast.data?.actionButton);
            
            setMessage({
              id: latestBroadcast.id,
              title: latestBroadcast.title,
              message: latestBroadcast.message,
              createdAt: latestBroadcast.createdAt,
              data: latestBroadcast.data
            });
            setIsVisible(true);
            
            // Mark as shown
            shownBroadcasts.push(latestBroadcast.id);
            localStorage.setItem('shownBroadcasts', JSON.stringify(shownBroadcasts));
            
            // Mark as read after showing
            setTimeout(() => {
              markAsRead(latestBroadcast.id);
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Error checking broadcasts:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setMessage(null);
    }, 200);
  };

  const handleActionClick = () => {
    console.log('🔘 Action button clicked!');
    console.log('🔘 Message data:', message?.data);
    console.log('🔘 Action button:', message?.data?.actionButton);
    
    if (message?.data?.actionButton?.link) {
      const link = message.data.actionButton.link;
      console.log('🔘 Navigating to:', link);
      handleClose();
      setTimeout(() => {
        router.push(link);
      }, 250);
    }
  };

  if (!isVisible || !message) return null;

  const hasActionButton = message.data?.actionButton?.text && message.data?.actionButton?.link;
  console.log('🔘 Has action button:', hasActionButton, message.data?.actionButton);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Apple-Style Clean Modal */}
      <div 
        className={`relative w-full max-w-sm transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Card - Clean Apple Style */}
        <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <IoInformationCircleOutline className="w-9 h-9 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-3 px-2">
              {message.title}
            </h2>

            {/* Message */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center leading-relaxed whitespace-pre-wrap px-2">
                {message.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Custom Action Button (if provided) */}
              {hasActionButton && (
                <button
                  onClick={handleActionClick}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>{message.data!.actionButton!.text}</span>
                  <IoArrowForwardOutline className="w-4 h-4" />
                </button>
              )}
              
              {/* Dismiss Button */}
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm font-semibold transition-colors"
              >
                {hasActionButton ? 'Maybe Later' : 'Got it'}
              </button>
            </div>

            {/* Timestamp */}
            <div className="text-center mt-4">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
