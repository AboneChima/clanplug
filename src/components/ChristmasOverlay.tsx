'use client';

import { useEffect, useState } from 'react';

interface ChristmasOverlayProps {
  isVerified: boolean;
}

export default function ChristmasOverlay({ isVerified }: ChristmasOverlayProps) {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; x: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    if (isVerified) {
      // Generate beautiful snowflakes
      const newSnowflakes = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 15,
        size: 10 + Math.random() * 20,
      }));
      setSnowflakes(newSnowflakes);
    }
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
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(100px) rotate(360deg);
            opacity: 0;
          }
        }

        .snowflake {
          position: absolute;
          color: white;
          pointer-events: none;
          animation: snowfall linear infinite;
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Beautiful Snowflakes */}
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
              opacity: 0.7 + Math.random() * 0.3,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  );
}
