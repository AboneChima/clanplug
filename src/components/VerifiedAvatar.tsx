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
    <div className="relative">
      {/* Animated glow rings */}
      <div className="absolute inset-0 animate-pulse-glow">
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-60`} />
      </div>
      <div className="absolute inset-0 animate-pulse-glow-delayed">
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 blur-lg opacity-40`} />
      </div>

      {/* Avatar with premium border */}
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full p-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin-slow`}>
          <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-slate-900`}>
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
        </div>

        {/* Verified badge with animation */}
        <div className="absolute -bottom-1 -right-1 animate-bounce-subtle">
          <div className="relative">
            {/* Badge glow */}
            <div className={`absolute inset-0 ${badgeSizes[size]} bg-blue-500 rounded-full blur-md animate-pulse`} />
            
            {/* Badge */}
            <div className={`relative ${badgeSizes[size]} bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg`}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes pulse-glow-delayed {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1.05);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.15);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-pulse-glow-delayed {
          animation: pulse-glow-delayed 3s ease-in-out infinite 0.5s;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
