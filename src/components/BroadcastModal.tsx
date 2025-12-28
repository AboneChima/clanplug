'use client';

import { IoCloseOutline, IoInformationCircleOutline, IoArrowForwardOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

interface BroadcastModalProps {
  notification: {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    data?: any;
  };
  onClose: () => void;
}

export default function BroadcastModal({ notification, onClose }: BroadcastModalProps) {
  const router = useRouter();

  const handleActionClick = () => {
    const actionButton = notification.data?.actionButton;
    if (actionButton?.link) {
      onClose();
      setTimeout(() => {
        router.push(actionButton.link);
      }, 200);
    }
  };

  const actionButton = notification.data?.actionButton;
  const hasActionButton = actionButton?.text && actionButton?.link;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Modal */}
      <div 
        className="relative w-full max-w-sm transform animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Card - Slate Theme */}
        <div className="relative bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-gray-400 hover:bg-slate-600 hover:text-white transition-colors"
          >
            <IoCloseOutline className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <IoInformationCircleOutline className="w-9 h-9 text-blue-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center text-white mb-3 px-2">
              {notification.title}
            </h2>

            {/* Message */}
            <div className="mb-6">
              <p className="text-sm text-gray-300 text-center leading-relaxed whitespace-pre-wrap px-2">
                {notification.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              {/* Custom Action Button */}
              {hasActionButton && (
                <button
                  onClick={handleActionClick}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>{actionButton.text}</span>
                  <IoArrowForwardOutline className="w-4 h-4" />
                </button>
              )}
              
              {/* Dismiss Button */}
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white text-sm font-semibold transition-all"
              >
                Close
              </button>
            </div>

            {/* Timestamp */}
            <div className="text-center mt-4">
              <span className="text-xs text-gray-500">
                {new Date(notification.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
