'use client';

import React from 'react';
import {
  IoClose,
  IoCheckmarkCircle,
  IoCallOutline,
  IoWifiOutline,
  IoTimeOutline,
  IoReceiptOutline,
  IoPhonePortraitOutline,
} from 'react-icons/io5';

interface VTUTransactionModalProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    data?: {
      type: 'airtime' | 'data';
      amount: number;
      network: string;
      phoneNumber: string;
      planId?: string;
      reference: string;
    };
  };
  onClose: () => void;
}

const VTUTransactionModal: React.FC<VTUTransactionModalProps> = ({ notification, onClose }) => {
  const { data } = notification;
  
  if (!data) return null;

  const isAirtime = data.type === 'airtime';
  const networkColors: Record<string, string> = {
    MTN: 'from-yellow-400 to-yellow-600',
    GLO: 'from-green-400 to-green-600',
    AIRTEL: 'from-red-400 to-red-600',
    '9MOBILE': 'from-emerald-400 to-emerald-600',
  };

  const networkColor = networkColors[data.network] || 'from-blue-400 to-blue-600';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${networkColor} p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white transition-colors"
          >
            <IoClose className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
              {isAirtime ? (
                <IoCallOutline className="w-8 h-8" />
              ) : (
                <IoWifiOutline className="w-8 h-8" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {isAirtime ? 'Airtime Purchase' : 'Data Purchase'}
            </h2>
            <p className="text-white/90 text-sm">{data.network}</p>
          </div>
        </div>

        {/* Success Badge */}
        <div className="flex justify-center -mt-6 mb-4">
          <div className="bg-white rounded-full p-2 shadow-lg">
            <div className="bg-green-100 rounded-full p-2">
              <IoCheckmarkCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="px-6 pb-6 space-y-4">
          {/* Amount */}
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm mb-1">Amount</p>
            <p className="text-4xl font-bold text-gray-900">₦{data.amount.toLocaleString()}</p>
          </div>

          {/* Details Grid */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {/* Phone Number */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <IoPhonePortraitOutline className="w-5 h-5" />
                <span className="text-sm">Phone Number</span>
              </div>
              <span className="font-semibold text-gray-900">{data.phoneNumber}</span>
            </div>

            {/* Network */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <IoWifiOutline className="w-5 h-5" />
                <span className="text-sm">Network</span>
              </div>
              <span className="font-semibold text-gray-900">{data.network}</span>
            </div>

            {/* Reference */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <IoReceiptOutline className="w-5 h-5" />
                <span className="text-sm">Reference</span>
              </div>
              <span className="font-mono text-xs text-gray-700">{data.reference}</span>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <IoTimeOutline className="w-5 h-5" />
                <span className="text-sm">Date</span>
              </div>
              <span className="text-sm text-gray-900">
                {new Date(notification.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800 text-sm text-center">
              {notification.message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VTUTransactionModal;
