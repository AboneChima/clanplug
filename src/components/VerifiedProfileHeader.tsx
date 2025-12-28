'use client';

import { useEffect, useState } from 'react';

interface VerifiedProfileHeaderProps {
  isVerified: boolean;
  children: React.ReactNode;
}

export default function VerifiedProfileHeader({ isVerified, children }: VerifiedProfileHeaderProps) {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; x: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    if (isVerified) {
      // Generate snowflakes
      const newSnowflakes = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
        size: 4 + Math.random() * 8,
      }));
      setSnowflakes(newSnowflakes);
    }
  }, [isVerified]);

  if (!isVerified) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Christmas gradient background - Red, Gold, Green */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-amber-900/5 to-green-900/5 rounded-3xl overflow-hidden">
        {/* Snowflakes */}
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute text-white opacity-80 animate-snowfall pointer-events-none"
            style={{
              left: `${flake.x}%`,
              top: '-10px',
              fontSize: `${flake.size}px`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
            }}
          >
            ❄
          </div>
        ))}
        
        {/* Subtle golden glow orbs */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-red-400/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-44 h-44 bg-green-400/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Premium golden border */}
      <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 opacity-30 animate-shimmer" style={{ padding: '2px' }}>
        <div className="w-full h-full bg-slate-900 rounded-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10px) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(50px);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(20px, -20px);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-20px, 20px);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(10px, -10px) scale(1.05);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .animate-snowfall {
          animation: snowfall linear infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
