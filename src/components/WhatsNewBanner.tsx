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
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl max-[360px]:rounded-lg p-3 max-[360px]:p-2.5 xs:p-4 mb-3 xs:mb-4 relative shadow-lg">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 max-[360px]:top-1.5 max-[360px]:right-1.5 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close"
      >
        <IoCloseOutline className="w-4 h-4 max-[360px]:w-3.5 max-[360px]:h-3.5 text-white" />
      </button>
      
      <div className="pr-7 max-[360px]:pr-6">
        <h3 className="text-white font-semibold text-sm max-[360px]:text-xs xs:text-base mb-1.5 max-[360px]:mb-1 xs:mb-2">
          ✨ Complete KYC to Sell on Marketplace
        </h3>
        
        <p className="text-white/90 text-xs max-[360px]:text-[11px] max-[360px]:leading-snug xs:text-sm mb-2 max-[360px]:mb-1.5 xs:mb-3 leading-relaxed">
          KYC verification required to create shop listings. Quick face verification - no documents needed!
        </p>

        <Link
          href="/kyc"
          className="inline-block px-3 py-1.5 max-[360px]:px-2.5 max-[360px]:py-1 max-[360px]:text-[11px] xs:px-4 xs:py-2 bg-white text-purple-600 rounded-lg font-semibold text-xs xs:text-sm hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
        >
          Get KYC Verified
        </Link>
      </div>
    </div>
  );
}
