'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { IoBanOutline, IoMailOutline, IoLogOutOutline } from 'react-icons/io5';

export default function BannedUserModal() {
  const { user, logout } = useAuth();
  const [isBanned, setIsBanned] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Check user status periodically
    const checkUserStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token || !user) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const userData = data.data || data.user || data;
          
          // Check if user is banned or suspended
          if (userData.status === 'BANNED' || userData.status === 'banned') {
            setIsBanned(true);
          }
        } else if (response.status === 403) {
          // User is banned
          setIsBanned(true);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    // Check immediately
    checkUserStatus();

    // Check every 30 seconds
    const interval = setInterval(checkUserStatus, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  if (!isBanned) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <div className="bg-slate-900 border-2 border-red-500/50 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <IoBanOutline className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center">Account Suspended</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-gray-300 text-center leading-relaxed">
              Your account has been suspended due to a violation of our terms of service. 
              You will not be able to access platform features at this time.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-gray-400">
              <IoMailOutline className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white mb-1">Need Help?</p>
                <p>Contact our support team at <a href="mailto:admin@clanplug.site" className="text-blue-400 hover:text-blue-300 underline">admin@clanplug.site</a> for more information.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg font-medium transition-colors"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <IoLogOutOutline className="w-5 h-5" />
                  <span>Logout</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            If you believe this is a mistake, please contact support immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
