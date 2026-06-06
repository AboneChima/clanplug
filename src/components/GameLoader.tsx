'use client';

import { useEffect, useState } from 'react';

export default function GameLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const increment = prev < 60 ? 4 : prev < 90 ? 3 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 30);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* Subtle gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ top: '20%', left: '10%' }}></div>
        <div className="absolute w-80 h-80 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ bottom: '20%', right: '10%', animationDelay: '1s' }}></div>
        <div className="absolute w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Compact Logo */}
        <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
          <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 6v12l10-6z"/>
            </svg>
          </div>
        </div>

        {/* Compact Progress */}
        <div className="w-32">
          <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
