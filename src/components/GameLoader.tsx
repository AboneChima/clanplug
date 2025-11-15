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
        // Smooth acceleration
        const increment = prev < 60 ? 3 : prev < 90 ? 2 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 40);

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl animate-float-slow" style={{ top: '10%', left: '5%' }}></div>
        <div className="absolute w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl animate-float-slow" style={{ bottom: '10%', right: '5%', animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-8">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Clan Plug
          </h1>
          <p className="text-gray-400 text-sm font-medium">Loading your experience...</p>
        </div>

        {/* Modern Progress Bar */}
        <div className="relative">
          {/* Background track */}
          <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
            {/* Progress fill with gradient */}
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          {/* Progress percentage */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-500 font-medium">Please wait</span>
            <span className="text-sm text-gray-300 font-bold font-mono">{progress}%</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
