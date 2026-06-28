'use client';

interface UploadProgressProps {
  progress: number;
  fileName: string;
  fileSize: string;
}

export default function UploadProgress({ progress, fileName, fileSize }: UploadProgressProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full mx-4 border border-[#2f3336]">
        {/* File Icon Animation */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-2xl border-4 border-blue-500 animate-ping opacity-20"></div>
          </div>
        </div>

        {/* File Info */}
        <div className="text-center mb-4">
          <p className="text-white font-medium text-sm truncate">{fileName}</p>
          <p className="text-gray-400 text-xs mt-1">{fileSize}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-[#2f3336] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Status Text */}
        <p className="text-center text-gray-500 text-xs">
          {progress < 100 ? 'Please wait...' : 'Processing...'}
        </p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
