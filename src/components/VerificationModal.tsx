'use client';

import { useState } from 'react';
import { IoCloseOutline, IoCheckmarkCircleOutline, IoShieldCheckmarkOutline, IoImageOutline, IoTimeOutline } from 'react-icons/io5';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isRenewal?: boolean;
}

export default function VerificationModal({ isOpen, onClose, onSuccess, isRenewal = false }: VerificationModalProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      const token = localStorage.getItem('accessToken');
      const endpoint = isRenewal ? '/api/verification/renew' : '/api/verification/purchase';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Verification badge activated successfully!', 'success');
        onSuccess();
        onClose();
      } else {
        if (data.message?.includes('Insufficient balance')) {
          showToast('Insufficient balance. Redirecting to wallet...', 'error');
          setTimeout(() => router.push('/wallet'), 2000);
        } else {
          showToast(data.message || 'Failed to purchase verification', 'error');
        }
      }
    } catch (error) {
      showToast('Error purchasing verification', 'error');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl w-full max-w-[340px] sm:max-w-sm border border-blue-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-slate-700/50 sticky top-0 bg-slate-800/95 backdrop-blur-sm">
          <h2 className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {isRenewal ? '✨ Renew Verification' : '✨ Get Verified'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <IoCloseOutline className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          {/* Badge Preview */}
          <div className="flex items-center justify-center py-1.5 sm:py-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
              <IoShieldCheckmarkOutline className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-start gap-1.5 sm:gap-2">
              <IoCheckmarkCircleOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-[11px] sm:text-xs" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>✓ Verified Badge</p>
                <p className="text-gray-400 text-[9px] sm:text-[10px]">Blue checkmark next to your name</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5 sm:gap-2">
              <IoImageOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-[11px] sm:text-xs" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>✓ Post Images & Media</p>
                <p className="text-gray-400 text-[9px] sm:text-[10px]">Upload photos and videos</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5 sm:gap-2">
              <IoCheckmarkCircleOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-[11px] sm:text-xs" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>✓ Unlimited Posts</p>
                <p className="text-gray-400 text-[9px] sm:text-[10px]">No daily post limits</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5 sm:gap-2">
              <IoShieldCheckmarkOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-[11px] sm:text-xs" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>✓ Username Protection</p>
                <p className="text-gray-400 text-[9px] sm:text-[10px]">Your username can't be taken</p>
              </div>
            </div>
            <div className="flex items-start gap-1.5 sm:gap-2">
              <IoTimeOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-[11px] sm:text-xs" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>✓ 30 Days Access</p>
                <p className="text-gray-400 text-[9px] sm:text-[10px]">Full month of premium features</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-2.5 sm:p-3 border border-blue-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-300 text-[10px] sm:text-xs" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Duration</span>
              <span className="text-blue-300 font-bold text-xs sm:text-sm" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>30 Days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-[10px] sm:text-xs" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Cost</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 font-black text-xl sm:text-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>₦2,000</span>
            </div>
          </div>

          {/* Payment Info */}
          <p className="text-[9px] sm:text-[10px] text-gray-400 text-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            💳 Payment from your NGN wallet
          </p>

          {/* Action Buttons */}
          <div className="flex gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-semibold text-[10px] sm:text-xs"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-bold text-[10px] sm:text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {purchasing ? '⏳ Processing...' : '✨ Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
