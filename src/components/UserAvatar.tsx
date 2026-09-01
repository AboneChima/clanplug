'use client';

import Image from 'next/image';
import { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({ src, alt, size = 40, className = '' }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Show default avatar if no src, empty string, or image failed to load
  const shouldShowDefault = !src || src.trim() === '' || imageError;
  
  if (shouldShowDefault) {
    // Default avatar with initials
    const initials = alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    return (
      <div 
        className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }
  
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      unoptimized
      onError={() => setImageError(true)}
    />
  );
}
