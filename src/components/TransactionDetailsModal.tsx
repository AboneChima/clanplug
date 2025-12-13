"use client";

import { IoClose, IoCheckmarkCircle, IoArrowUp, IoArrowDown, IoSwapHorizontal, IoWallet, IoCalendar, IoReceipt } from 'react-icons/io5';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    createdAt: string;
    data?: {
      type?: string;
      amount?: number;
      currency?: string;
      reference?: string;
      transactionId?: string;
      fee?: number;
      recipient?: string;
      sender?: string;
      direction?: 'credit' | 'debit';
    };
  };
}

export default function TransactionDetailsModal({ isOpen, onClose, notification }: TransactionDetailsModalProps) {
  if (!isOpen) return null;

  const data = notification.data || {};
  const isCredit = data.direction === 'credit' || data.type === 'deposit' || data.type === 'transfer_received';
  const isDebit = data.direction === 'debit' || data.type === 'transfer_sent' || data.type === 'withdrawal';

  const getIcon = () => {
    if (data.type === 'deposit') return <IoArrowDown className="w-8 h-8" />;
    if (data.type === 'withdrawal') return <IoArrowUp className="w-8 h-8" />;
    if (data.type === 'transfer_sent') return <IoArrowUp className="w-8 h-8" />;
    if (data.type === 'transfer_received') return <IoArrowDown className="w-8 h-8" />;
    return <IoSwapHorizontal className="w-8 h-8" />;
  };

  const getColor = () => {
    if (isCredit) return 'from-green-500 to-emerald-600';
    if (isDebit) return 'from-red-500 to-rose-600';
    return 'from-blue-500 to-indigo-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
    return `${symbol}${Math.abs(amount).toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-16 sm:pb-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Shorter height, full width on mobile */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[70vh] sm:max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Header with gradient - Compact on mobile */}
        <div className={`bg-gradient-to-r ${getColor()} p-4 xs:p-5 sm:p-6 text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <IoClose className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              {getIcon()}
            </div>
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(data.amount || 0, data.currency || 'NGN')}
            </h2>
            <p className="text-white/90 text-xs xs:text-sm sm:text-base">{notification.title}</p>
          </div>
        </div>

        {/* Content - Compact on mobile with bottom padding for menu */}
        <div className="p-4 xs:p-5 sm:p-6 space-y-3 xs:space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(70vh-140px)] sm:max-h-[calc(85vh-180px)] pb-6">
          {/* Status */}
          <div className="flex items-center justify-center gap-2 py-2 px-3 bg-green-50 rounded-lg border border-green-200">
            <IoCheckmarkCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-green-800 font-semibold text-xs sm:text-sm">Completed</span>
          </div>

          {/* Details */}
          <div className="space-y-3">
            {/* Amount */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600 text-xs sm:text-sm">Amount</span>
              <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                {formatCurrency(data.amount || 0, data.currency || 'NGN')}
              </span>
            </div>

            {/* Fee (if applicable) */}
            {data.fee && data.fee > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 text-xs sm:text-sm">Fee (0.5%)</span>
                <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                  {formatCurrency(data.fee, data.currency || 'NGN')}
                </span>
              </div>
            )}

            {/* Recipient/Sender */}
            {data.recipient && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 text-xs sm:text-sm">Sent to</span>
                <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[60%]">
                  {data.recipient}
                </span>
              </div>
            )}
            {data.sender && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 text-xs sm:text-sm">From</span>
                <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[60%]">
                  {data.sender}
                </span>
              </div>
            )}

            {/* Reference */}
            {data.reference && (
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <IoReceipt className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600 text-xs sm:text-sm">Reference</span>
                </div>
                <p className="font-mono text-[10px] sm:text-xs text-gray-900 bg-gray-50 p-2 rounded break-all">
                  {data.reference}
                </p>
              </div>
            )}

            {/* Date */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1.5">
                <IoCalendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-600 text-xs sm:text-sm">Date</span>
              </div>
              <span className="text-gray-900 text-xs sm:text-sm">{formatDate(notification.createdAt)}</span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
