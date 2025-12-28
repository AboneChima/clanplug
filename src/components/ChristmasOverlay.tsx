'use client';

import { useEffect, useState, useRef } from 'react';

interface ChristmasOverlayProps {
  isVerified: boolean;
}

export default function ChristmasOverlay({ isVerified }: ChristmasOverlayProps) {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; x: number; delay: number; duration: number; size: number }>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isVerified) {
      // Reduced to 30 snowflakes for smooth performance
      const newSnowflakes = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 12 + Math.random() * 10,
        size: 12 + Math.random() * 12,
      }));
      setSnowflakes(newSnowflakes);

      // Play subtle snow sound
      if (typeof window !== 'undefined') {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audioRef.current.volume = 0.1;
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {
          // Autoplay might be blocked, that's okay
        });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isVerified]);

  if (!isVerified) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-30px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) translateX(50px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: rotate(-2deg);
          }
          50% {
            transform: rotate(2deg);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .snowflake {
          position: absolute;
          color: white;
          pointer-events: none;
          animation: snowfall linear infinite;
          will-change: transform;
        }

        .christmas-tree {
          animation: sway 4s ease-in-out infinite;
          transform-origin: bottom center;
        }

        .christmas-star {
          animation: twinkle 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Optimized Snowflakes */}
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="snowflake"
            style={{
              left: `${flake.x}%`,
              top: '-30px',
              fontSize: `${flake.size}px`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
              opacity: 0.7,
            }}
          >
            ❄
          </div>
        ))}

        {/* Small Christmas Trees - Bottom corners */}
        <div className="absolute bottom-2 left-2 text-3xl sm:text-4xl christmas-tree opacity-60">
          🎄
        </div>
        <div className="absolute bottom-2 right-2 text-3xl sm:text-4xl christmas-tree opacity-60" style={{ animationDelay: '1s' }}>
          🎄
        </div>

        {/* Small Stars - Top corners */}
        <div className="absolute top-20 left-4 text-xl sm:text-2xl christmas-star opacity-70">
          ⭐
        </div>
        <div className="absolute top-20 right-4 text-xl sm:text-2xl christmas-star opacity-70" style={{ animationDelay: '0.5s' }}>
          ✨
        </div>

        {/* Small Candy Canes */}
        <div className="absolute top-1/3 left-4 text-2xl opacity-50">
          🍭
        </div>
        <div className="absolute top-2/3 right-4 text-2xl opacity-50">
          🍭
        </div>

        {/* Small Gifts */}
        <div className="absolute bottom-1/4 left-8 text-2xl opacity-50">
          🎁
        </div>
        <div className="absolute bottom-1/3 right-8 text-2xl opacity-50">
          🎁
        </div>

        {/* Small Bells - Hidden on mobile */}
        <div className="hidden sm:block absolute top-32 left-1/4 text-xl opacity-50">
          🔔
        </div>
        <div className="hidden sm:block absolute top-32 right-1/4 text-xl opacity-50">
          🔔
        </div>
      </div>
    </>
  );
}
