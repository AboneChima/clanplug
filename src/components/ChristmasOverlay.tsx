'use client';

import { useEffect, useState } from 'react';

interface ChristmasOverlayProps {
  isVerified: boolean;
}

export default function ChristmasOverlay({ isVerified }: ChristmasOverlayProps) {
  const [snowflakes, setSnowflakes] = useState<Array<{ 
    id: number; 
    x: number; 
    delay: number; 
    duration: number; 
    size: number;
  }>>([]);

  useEffect(() => {
    if (isVerified) {
      console.log('🎄 ChristmasOverlay: Creating snowflakes for verified user');
      // Create snowflakes
      const newSnowflakes = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 10 + Math.random() * 10,
        size: 10 + Math.random() * 14,
      }));
      setSnowflakes(newSnowflakes);
    } else {
      console.log('🎄 ChristmasOverlay: User not verified, no snowfall');
    }
  }, [isVerified]);

  if (!isVerified) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        @keyframes snowfall-animation {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
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

        .christmas-snowflake {
          position: absolute;
          color: white;
          pointer-events: none;
          animation: snowfall-animation linear infinite;
          will-change: transform;
          z-index: 9999;
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        {/* Snowflakes */}
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="christmas-snowflake"
            style={{
              left: `${flake.x}%`,
              top: '-20px',
              fontSize: `${flake.size}px`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  );
}
