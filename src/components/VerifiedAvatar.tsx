'use client';

interface VerifiedAvatarProps {
  src?: string;
  alt: string;
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function VerifiedAvatar({ src, alt, isVerified, size = 'xl' }: VerifiedAvatarProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-28 h-28 xs:w-32 xs:h-32 sm:w-36 sm:h-36',
  };

  const badgeSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7 xs:w-8 xs:h-8',
  };

  const hatSizes = {
    sm: 'w-8 h-8 -top-6 -right-2',
    md: 'w-10 h-10 -top-7 -right-2',
    lg: 'w-14 h-14 -top-10 -right-3',
    xl: 'w-16 h-16 xs:w-18 xs:h-18 -top-12 xs:-top-14 -right-3 xs:-right-4',
  };

  if (!isVerified) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-slate-700`}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {alt.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes wiggle-hat {
          0%, 100% {
            transform: rotate(-8deg);
          }
          50% {
            transform: rotate(8deg);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(180deg);
          }
        }

        .glow-ring {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .santa-hat {
          animation: wiggle-hat 2s ease-in-out infinite;
          transform-origin: bottom center;
        }

        .sparkle {
          animation: twinkle 2s ease-in-out infinite;
        }

        .sparkle-delayed {
          animation: twinkle 2.5s ease-in-out infinite 0.5s;
        }
      `}</style>

      <div className="relative">
        {/* Soft golden glow - Apple-like */}
        <div className="absolute inset-0 glow-ring">
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 blur-2xl opacity-40`} />
        </div>

        {/* Avatar with premium golden border */}
        <div className="relative">
          <div className={`${sizeClasses[size]} rounded-full p-1 bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 shadow-2xl shadow-amber-500/30`}>
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white`}>
              {src ? (
                <img src={src} alt={alt} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {alt.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Christmas Santa Hat - Animated */}
          <div className={`absolute ${hatSizes[size]} z-20 santa-hat`}>
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Hat body */}
              <path d="M10 35 L32 10 L54 35 Z" fill="#DC2626" />
              {/* Hat trim */}
              <ellipse cx="32" cy="35" rx="24" ry="4" fill="#FFFFFF" />
              {/* Pom pom */}
              <circle cx="32" cy="8" r="6" fill="#FFFFFF" />
              {/* Shadow on hat */}
              <path d="M10 35 L32 10 L32 35 Z" fill="#B91C1C" opacity="0.3" />
            </svg>
          </div>

          {/* Premium verified badge - Gold theme */}
          <div className="absolute -bottom-1 -right-1 z-10">
            <div className="relative">
              {/* Badge glow */}
              <div className={`absolute inset-0 ${badgeSizes[size]} bg-amber-400 rounded-full blur-md glow-ring`} />
              
              {/* Badge with Christmas colors */}
              <div className={`relative ${badgeSizes[size]} bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center border-3 border-white shadow-xl`}>
                <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sparkle effects around avatar */}
          <div className="absolute -top-2 -right-2 text-amber-400 text-xl sparkle">✨</div>
          <div className="absolute -bottom-2 -left-2 text-yellow-400 text-lg sparkle-delayed">⭐</div>
        </div>
      </div>
    </>
  );
}
