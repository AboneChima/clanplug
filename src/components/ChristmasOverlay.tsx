'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ChristmasOverlayProps {
  isVerified: boolean;
}

export default function ChristmasOverlay({ isVerified }: ChristmasOverlayProps) {
  const pathname = usePathname();
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    x: number; 
    delay: number; 
    duration: number; 
    size: number;
    type: 'candy' | 'tree' | 'star' | 'snowflake';
  }>>([]);

  // Only show on profile pages
  const isProfilePage = pathname === '/profile' || pathname?.startsWith('/user/');

  useEffect(() => {
    if (isVerified && isProfilePage) {
      console.log('🎄 ChristmasOverlay: Creating celebration particles for verified user');
      // Create varied celebration particles
      const newParticles = Array.from({ length: 40 }, (_, i) => {
        const types: Array<'candy' | 'tree' | 'star' | 'snowflake'> = ['candy', 'tree', 'star', 'snowflake'];
        return {
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 8,
          duration: 6 + Math.random() * 8,
          size: 3 + Math.random() * 5, // Very small: 3-8px
          type: types[Math.floor(Math.random() * types.length)],
        };
      });
      setParticles(newParticles);
    } else {
      console.log('🎄 ChristmasOverlay: Not showing (verified:', isVerified, 'profile page:', isProfilePage, ')');
    }
  }, [isVerified, isProfilePage]);

  if (!isVerified || !isProfilePage) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        @keyframes celebration-fall {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          90% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(100vh) translateX(25px) rotate(360deg);
            opacity: 0;
          }
        }

        .celebration-particle {
          position: absolute;
          pointer-events: none;
          animation: celebration-fall linear infinite;
          will-change: transform;
          z-index: 9999;
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        {/* Celebration particles */}
        {particles.map((particle) => {
          let emoji = '❄';
          
          switch(particle.type) {
            case 'candy':
              emoji = '🍬';
              break;
            case 'tree':
              emoji = '🎄';
              break;
            case 'star':
              emoji = '⭐';
              break;
            case 'snowflake':
              emoji = '❄';
              break;
          }
          
          return (
            <div
              key={particle.id}
              className="celebration-particle"
              style={{
                left: `${particle.x}%`,
                top: '-20px',
                fontSize: `${particle.size}px`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            >
              {emoji}
            </div>
          );
        })}
      </div>
    </>
  );
}
