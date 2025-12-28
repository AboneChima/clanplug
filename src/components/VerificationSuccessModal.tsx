'use client';

import { useEffect } from 'react';
import { IoCheckmarkCircleOutline, IoCloseOutline } from 'react-icons/io5';

interface VerificationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  duration?: string;
}

export default function VerificationSuccessModal({ 
  isOpen, 
  onClose,
  duration = '30 days'
}: VerificationSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      {/* Confetti Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Modal Content */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-blue-500/30 shadow-2xl shadow-blue-500/20 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-full transition-colors"
        >
          <IoCloseOutline className="w-5 h-5 text-gray-400" />
        </button>

        {/* Badge Icon with Glow */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-50 animate-pulse"></div>
            
            {/* Badge */}
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-6 animate-bounce-slow">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white animate-slide-up">
            🎉 Congratulations!
          </h2>
          <p className="text-lg text-blue-400 font-semibold animate-slide-up" style={{ animationDelay: '0.1s' }}>
            You're Now Verified!
          </p>
          <p className="text-sm text-gray-400 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Your verification badge is active for {duration}
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-6 space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <IoCheckmarkCircleOutline className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span>Blue checkmark on your profile</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <IoCheckmarkCircleOutline className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span>Increased trust from other users</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <IoCheckmarkCircleOutline className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span>Stand out in the marketplace</span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          Awesome! Let's Go
        </button>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes slide-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
