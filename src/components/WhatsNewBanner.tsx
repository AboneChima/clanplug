'use client';

import { useState, useEffect } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import Link from 'next/link';

export default function WhatsNewBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this version
    const dismissed = localStorage.getItem('whatsNew_kyc_v4');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('whatsNew_kyc_v4', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-3 xs:p-4 mb-3 xs:mb-4 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-1.5 right-1.5 xs:top-2 xs:right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close"
      >
        <IoCloseOutline className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
      </button>
      
      <div className="pr-6 xs:pr-8">
        <h3 className="text-white font-bold text-sm xs:text-base mb-1.5 xs:mb-2">
          ✨ Complete KYC to Sell on Marketplace
        </h3>
        
        <p className="text-white/95 text-xs xs:text-sm mb-2 xs:mb-3">
          KYC verification required to create shop listings. Quick face verification - no documents needed!
        </p>

        <Link
          href="/kyc"
          className="inline-block px-3 py-1.5 xs:px-4 xs:py-2 bg-white text-purple-600 rounded-lg font-semibold text-xs xs:text-sm hover:bg-gray-100 transition-colors"
        >
          Get KYC Verified
        </Link>
      </div>
    </div>
  );
}
