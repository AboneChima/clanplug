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
      // Create varied snowflakes - mix of snowflakes and snowballs
      const newSnowflakes = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 8 + Math.random() * 12,
        size: 4 + Math.random() * 8, // Smaller sizes (4-12px)
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
            opacity: 0.9;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(100vh) translateX(30px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes snowball-animation {
          0% {
            transform: translateY(-20px) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(20px);
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

        .christmas-snowball {
          position: absolute;
          background: radial-gradient(circle at 30% 30%, #ffffff, #e0e0e0);
          border-radius: 50%;
          pointer-events: none;
          animation: snowball-animation linear infinite;
          will-change: transform;
          z-index: 9999;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        {/* Snowflakes and Snowballs */}
        {snowflakes.map((flake) => {
          // 30% chance of being a snowball
          const isSnowball = flake.id % 10 < 3;
          
          if (isSnowball) {
            return (
              <div
                key={flake.id}
                className="christmas-snowball"
                style={{
                  left: `${flake.x}%`,
                  top: '-20px',
                  width: `${flake.size}px`,
                  height: `${flake.size}px`,
                  animationDelay: `${flake.delay}s`,
                  animationDuration: `${flake.duration}s`,
                }}
              />
            );
          }
          
          return (
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
          );
        })}
      </div>
    </>
  );
}
