'use client';

import { useState, useEffect } from 'react';
import { IoCloseOutline, IoSparklesOutline } from 'react-icons/io5';
import Link from 'next/link';

export default function WhatsNewBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this announcement
    const dismissed = localStorage.getItem('whatsNew_faceVerification_dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('whatsNew_faceVerification_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-4 mb-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <IoSparklesOutline className="w-5 h-5 text-yellow-300 animate-pulse" />
              <h3 className="text-white font-bold text-sm sm:text-base">
                🎉 What's New: Face Verification!
              </h3>
            </div>
            
            <p className="text-white/90 text-xs sm:text-sm mb-3 leading-relaxed">
              No documents? No problem! Verify your account in just 2 minutes with our new Face Verification feature. 
              No NIN or BVN required - just 4 simple selfie steps!
            </p>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/kyc"
                className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                <IoSparklesOutline className="w-4 h-4" />
                Try Face Verification
              </Link>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-white/30 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <IoCloseOutline className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}
