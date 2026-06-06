'use client';

import { useEffect, useState } from 'react';
import { IoCloseOutline, IoInformationCircleOutline, IoArrowForwardOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  data?: any;
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
            console.log('📢 BROADCAST RECEIVED:', latestBroadcast);
            console.log('📢 DATA FIELD:', latestBroadcast.data);
            console.log('📢 ACTION BUTTON:', latestBroadcast.data?.actionButton);
            
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
    const actionButton = message?.data?.actionButton;
    console.log('🔘 BUTTON CLICKED!');
    console.log('🔘 Action button object:', actionButton);
    
    if (actionButton?.link) {
      console.log('🔘 Navigating to:', actionButton.link);
      handleClose();
      setTimeout(() => {
        router.push(actionButton.link);
      }, 250);
    } else {
      console.log('❌ No link found in action button');
    }
  };

  if (!isVisible || !message) return null;

  const actionButton = message.data?.actionButton;
  const hasActionButton = actionButton?.text && actionButton?.link;
  
  console.log('🎨 RENDERING OVERLAY');
  console.log('🎨 Message:', message);
  console.log('🎨 Has action button:', hasActionButton);
  console.log('🎨 Action button:', actionButton);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Minimal Modal */}
      <div 
        className={`relative w-full max-w-sm transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card */}
        <div className="relative bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden border border-[#333]">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-gray-400 hover:bg-[#333] hover:text-white transition-colors"
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Title */}
            <h2 className="text-lg font-bold text-white mb-2">
              {message.title}
            </h2>

            {/* Message */}
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              {message.message}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {hasActionButton && (
                <button
                  onClick={handleActionClick}
                  className="flex-1 py-2.5 rounded-lg bg-white hover:bg-gray-100 text-black text-sm font-semibold transition-all"
                >
                  {actionButton.text}
                </button>
              )}
              
              <button
                onClick={handleClose}
                className={`${hasActionButton ? 'px-4' : 'flex-1'} py-2.5 rounded-lg bg-[#262626] hover:bg-[#333] text-white text-sm font-semibold transition-all`}
              >
                {hasActionButton ? 'Later' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
