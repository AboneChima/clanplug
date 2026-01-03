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
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 mb-4 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close"
      >
        <IoCloseOutline className="w-5 h-5 text-white" />
      </button>
      
      <div className="pr-8">
        <h3 className="text-white font-bold text-base mb-2">
          ✨ Complete KYC to Sell on Marketplace
        </h3>
        
        <p className="text-white/95 text-sm mb-3">
          KYC verification is required to create shop listings. Quick face verification available - no documents needed!
        </p>

        <Link
          href="/kyc"
          className="inline-block px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
        >
          Get KYC Verified (Free)
        </Link>
      </div>
    </div>
  );
}
