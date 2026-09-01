'use client';

import { useState } from 'react';
import { IoNotificationsOutline, IoCloseCircle } from 'react-icons/io5';
import { useToast } from '@/contexts/ToastContext';

export default function PushNotificationToggle() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    
    // Show toast that notifications are blocked by browser
    showToast('Push notifications have been disabled by Chrome for security reasons', 'error');
    
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2f3336]">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-500/10 rounded-lg">
          <IoCloseCircle className="w-5 h-5 text-red-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm mb-1">Push Notifications</h3>
          <p className="text-gray-400 text-xs mb-3">
            Push notifications are currently unavailable
          </p>
          
          {/* Permission Status */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-500 text-xs">Status:</span>
            <div className="flex items-center gap-1 text-red-500">
              <IoCloseCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Blocked by Browser</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : 'Enable Notifications'}
            </button>
          </div>

          <p className="text-red-400 text-[10px] mt-2 leading-relaxed">
            ⚠️ Push notifications have been disabled by Chrome for security reasons. This feature is temporarily unavailable.
          </p>
        </div>
      </div>
    </div>
  );
}
