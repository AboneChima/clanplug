'use client';

import { useEffect, useState } from 'react';
import { IoCloseOutline, IoSparklesOutline, IoArrowForwardOutline } from 'react-icons/io5';
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
    }, 300);
  };

  const handleActionClick = () => {
    if (message?.data?.actionButton?.link) {
      handleClose();
      setTimeout(() => {
        if (message.data?.actionButton?.link) {
          router.push(message.data.actionButton.link);
        }
      }, 300);
    }
  };

  if (!isVisible || !message) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* TikTok-Style Centered Modal */}
      <div 
        className={`relative w-full max-w-md transform transition-all duration-300 ${
          isClosing ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Gradient Background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl opacity-75 blur-lg animate-pulse"></div>
        
        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10">
          {/* Decorative Top Bar */}
          <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all hover:rotate-90 duration-300"
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Icon with Animated Glow */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Pulsing Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                
                {/* Icon Container */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-2xl">
                  <IoSparklesOutline className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-white mb-4 leading-tight">
              {message.title}
            </h2>

            {/* Message */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 mb-6">
              <p className="text-base text-white/90 text-center leading-relaxed whitespace-pre-wrap">
                {message.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Custom Action Button (if provided) */}
              {message.data?.actionButton && (
                <button
                  onClick={handleActionClick}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white text-base font-bold transition-all hover:shadow-2xl hover:shadow-purple-500/50 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>{message.data.actionButton.text}</span>
                  <IoArrowForwardOutline className="w-5 h-5" />
                </button>
              )}
              
              {/* Dismiss Button */}
              <button
                onClick={handleClose}
                className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-base font-semibold transition-all active:scale-95"
              >
                {message.data?.actionButton ? 'Maybe Later' : 'Got it!'}
              </button>
            </div>

            {/* Timestamp */}
            <div className="text-center mt-4">
              <span className="text-xs text-white/40">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Decorative Bottom Shimmer */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
