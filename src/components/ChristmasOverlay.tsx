'use client';

import { useEffect, useState } from 'react';

interface ChristmasOverlayProps {
  isVerified: boolean;
}

export default function ChristmasOverlay({ isVerified }: ChristmasOverlayProps) {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; x: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    if (isVerified) {
      // Generate more snowflakes for full page
      const newSnowflakes = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 8 + Math.random() * 12,
        size: 8 + Math.random() * 16,
      }));
      setSnowflakes(newSnowflakes);
    }
  }, [isVerified]);

  if (!isVerified) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Snowflakes */}
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute text-white opacity-70 animate-snowfall"
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

      {/* Christmas Trees - Bottom corners */}
      <div className="absolute bottom-0 left-0 text-6xl sm:text-8xl animate-sway opacity-80">
        🎄
      </div>
      <div className="absolute bottom-0 right-0 text-6xl sm:text-8xl animate-sway-reverse opacity-80">
        🎄
      </div>

      {/* Bells - Top corners */}
      <div className="absolute top-20 left-4 sm:left-8 text-4xl sm:text-5xl animate-swing opacity-90">
        🔔
      </div>
      <div className="absolute top-20 right-4 sm:right-8 text-4xl sm:text-5xl animate-swing-reverse opacity-90">
        🔔
      </div>

      {/* Gifts - Scattered */}
      <div className="absolute top-1/3 left-8 text-3xl sm:text-4xl animate-bounce-slow opacity-70">
        🎁
      </div>
      <div className="absolute top-2/3 right-8 text-3xl sm:text-4xl animate-bounce-slow-delayed opacity-70">
        🎁
      </div>

      {/* Stars - Twinkling */}
      <div className="absolute top-32 left-1/4 text-2xl sm:text-3xl animate-twinkle-star opacity-80">
        ⭐
      </div>
      <div className="absolute top-40 right-1/4 text-2xl sm:text-3xl animate-twinkle-star-delayed opacity-80">
        ✨
      </div>
      <div className="absolute top-1/2 left-1/3 text-xl sm:text-2xl animate-twinkle-star opacity-70">
        💫
      </div>

      {/* Candy Canes */}
      <div className="absolute top-1/4 right-12 text-3xl sm:text-4xl animate-rotate-slow opacity-75">
        🍭
      </div>
      <div className="absolute bottom-1/4 left-12 text-3xl sm:text-4xl animate-rotate-slow-reverse opacity-75">
        🍭
      </div>

      {/* Ornaments - Hanging */}
      <div className="absolute top-16 left-1/3 text-2xl sm:text-3xl animate-swing-ornament opacity-80">
        🎀
      </div>
      <div className="absolute top-24 right-1/3 text-2xl sm:text-3xl animate-swing-ornament-delayed opacity-80">
        🎀
      </div>

      {/* Snowman - Bottom center (hidden on small screens) */}
      <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 text-5xl animate-wave opacity-70">
        ⛄
      </div>

      {/* Santa - Top center (hidden on small screens) */}
      <div className="hidden lg:block absolute top-8 left-1/2 -translate-x-1/2 text-4xl animate-sleigh opacity-60">
        🎅
      </div>

      {/* Sparkles - Floating around */}
      <div className="absolute top-1/3 right-1/4 text-xl animate-float-sparkle opacity-60">
        ✨
      </div>
      <div className="absolute bottom-1/3 left-1/4 text-xl animate-float-sparkle-delayed opacity-60">
        ✨
      </div>

      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
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

        @keyframes sway {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        @keyframes sway-reverse {
          0%, 100% {
            transform: rotate(3deg);
          }
          50% {
            transform: rotate(-3deg);
          }
        }

        @keyframes swing {
          0%, 100% {
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
        }

        @keyframes swing-reverse {
          0%, 100% {
            transform: rotate(15deg);
          }
          50% {
            transform: rotate(-15deg);
          }
        }

        @keyframes swing-ornament {
          0%, 100% {
            transform: rotate(-10deg) translateY(0);
          }
          50% {
            transform: rotate(10deg) translateY(-5px);
          }
        }

        @keyframes swing-ornament-delayed {
          0%, 100% {
            transform: rotate(10deg) translateY(0);
          }
          50% {
            transform: rotate(-10deg) translateY(-5px);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes bounce-slow-delayed {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes twinkle-star {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.3) rotate(180deg);
          }
        }

        @keyframes twinkle-star-delayed {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.9) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(-180deg);
          }
        }

        @keyframes rotate-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotate-slow-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: translateX(-50%) rotate(-5deg);
          }
          50% {
            transform: translateX(-50%) rotate(5deg);
          }
        }

        @keyframes sleigh {
          0% {
            transform: translateX(-150%) translateY(0);
          }
          50% {
            transform: translateX(-50%) translateY(-10px);
          }
          100% {
            transform: translateX(150%) translateY(0);
          }
        }

        @keyframes float-sparkle {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-30px) scale(1.5);
            opacity: 1;
          }
        }

        @keyframes float-sparkle-delayed {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-25px) scale(1.3);
            opacity: 1;
          }
        }

        .animate-snowfall {
          animation: snowfall linear infinite;
        }

        .animate-sway {
          animation: sway 4s ease-in-out infinite;
        }

        .animate-sway-reverse {
          animation: sway-reverse 4s ease-in-out infinite;
        }

        .animate-swing {
          animation: swing 2s ease-in-out infinite;
          transform-origin: top center;
        }

        .animate-swing-reverse {
          animation: swing-reverse 2s ease-in-out infinite;
          transform-origin: top center;
        }

        .animate-swing-ornament {
          animation: swing-ornament 3s ease-in-out infinite;
          transform-origin: top center;
        }

        .animate-swing-ornament-delayed {
          animation: swing-ornament-delayed 3s ease-in-out infinite 0.5s;
          transform-origin: top center;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-bounce-slow-delayed {
          animation: bounce-slow-delayed 3.5s ease-in-out infinite 1s;
        }

        .animate-twinkle-star {
          animation: twinkle-star 2s ease-in-out infinite;
        }

        .animate-twinkle-star-delayed {
          animation: twinkle-star-delayed 2.5s ease-in-out infinite 0.7s;
        }

        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }

        .animate-rotate-slow-reverse {
          animation: rotate-slow-reverse 20s linear infinite;
        }

        .animate-wave {
          animation: wave 3s ease-in-out infinite;
        }

        .animate-sleigh {
          animation: sleigh 30s linear infinite;
        }

        .animate-float-sparkle {
          animation: float-sparkle 4s ease-in-out infinite;
        }

        .animate-float-sparkle-delayed {
          animation: float-sparkle-delayed 4.5s ease-in-out infinite 1s;
        }
      `}</style>
    </div>
  );
}
