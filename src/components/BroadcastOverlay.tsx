'use client';

import { useEffect, useState } from 'react';
import { IoCloseOutline, IoSparklesOutline } from 'react-icons/io5';

interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function BroadcastOverlay() {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=1`, {
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
            setMessage({
              id: latestBroadcast.id,
              title: latestBroadcast.title,
              message: latestBroadcast.message,
              createdAt: latestBroadcast.createdAt,
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

  if (!isVisible || !message) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm transition-all duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Liquid Glass Modal */}
      <div 
        className={`relative w-full sm:w-auto sm:min-w-[340px] sm:max-w-[380px] mx-3 mb-3 sm:mx-0 sm:mb-0 transform transition-all duration-200 ${
          isClosing ? 'translate-y-4 sm:translate-y-0 sm:scale-95 opacity-0' : 'translate-y-0 sm:scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Liquid Glass Card with Gradient Border */}
        <div className="relative group">
          {/* Animated Gradient Border */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
          
          {/* Main Glass Card */}
          <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none"></div>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <IoCloseOutline className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Content */}
            <div className="relative p-4 sm:p-5">
              {/* Icon with Glow */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="relative">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50"></div>
                  
                  {/* Icon Container */}
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                    <IoSparklesOutline className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-semibold text-center text-white mb-2 sm:mb-3 px-6 drop-shadow-lg">
                {message.title}
              </h2>

              {/* Message Card with Glass Effect */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3 sm:p-4 mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-white/90 text-center leading-relaxed whitespace-pre-wrap">
                  {message.message}
                </p>
              </div>

              {/* Timestamp */}
              <div className="text-center mb-3 sm:mb-4">
                <span className="text-[10px] sm:text-xs text-white/50">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Action Button with Glass Effect */}
              <button
                onClick={handleClose}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/20 text-white text-sm sm:text-base font-medium transition-all active:scale-98 shadow-lg"
              >
                Got it
              </button>
            </div>

            {/* Bottom Shimmer Effect */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
