'use client';

import { useState } from 'react';
import Image from 'next/image';
import { IoPersonOutline, IoImageOutline } from 'react-icons/io5';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  type?: 'avatar' | 'post';
  fallbackText?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className = '',
  type = 'avatar',
  fallbackText
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // If no src or error occurred, show fallback
  if (!src || error) {
    if (type === 'avatar') {
      // Avatar fallback - show initials or icon
      const initials = fallbackText || alt.charAt(0).toUpperCase();
      return (
        <div className={`flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 ${className}`}>
          {fallbackText ? (
            <span className="text-white font-bold text-lg">{initials}</span>
          ) : (
            <IoPersonOutline className="w-1/2 h-1/2 text-white" />
          )}
        </div>
      );
    } else {
      // Post fallback - show "Content Not Available"
      return (
        <div className={`flex flex-col items-center justify-center bg-[#1a1a1a] border border-[#2f3336] ${className}`}>
          <IoImageOutline className="w-12 h-12 text-gray-600 mb-2" />
          <p className="text-gray-500 text-sm font-medium">Content Not Available</p>
          <p className="text-gray-600 text-xs mt-1">This media has been removed</p>
        </div>
      );
    }
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-[#1a1a1a] ${className}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
