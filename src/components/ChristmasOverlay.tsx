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
    drift: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    if (isVerified) {
      // Create realistic snowflakes with varied properties
      const newSnowflakes = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 15 + Math.random() * 15, // Slower, more realistic
        size: 8 + Math.random() * 16,
        drift: -30 + Math.random() * 60, // Horizontal drift
        opacity: 0.4 + Math.random() * 0.6,
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
            opacity: var(--snow-opacity);
          }
          90% {
            opacity: var(--snow-opacity);
          }
          100% {
            transform: translateY(100vh) translateX(var(--snow-drift)) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(20px);
          }
        }

        .snowflake {
          position: absolute;
          color: white;
          pointer-events: none;
          animation: snowfall linear infinite, sway 3s ease-in-out infinite;
          will-change: transform, opacity;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
          filter: blur(0.5px);
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Realistic Snowflakes */}
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="snowflake"
            style={{
              left: `${flake.x}%`,
              top: '-30px',
              fontSize: `${flake.size}px`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s, ${3 + Math.random() * 2}s`,
              // @ts-ignore
              '--snow-drift': `${flake.drift}px`,
              '--snow-opacity': flake.opacity,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  );
}
