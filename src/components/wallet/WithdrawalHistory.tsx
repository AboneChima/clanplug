"use client";

import { useState, useEffect } from 'react';
import { IoTimeOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoHourglassOutline, IoCardOutline, IoCalendarOutline } from 'react-icons/io5';
import { authApi } from '@/lib/auth-api';

interface WithdrawalTransaction {
  id: string;
  reference: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'PROCESSING';
  narration?: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
}

interface WithdrawalHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawalHistory({ isOpen, onClose }: WithdrawalHistoryProps) {
  const [transactions, setTransactions] = useState<WithdrawalTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchWithdrawalHistory();
    }
  }, [isOpen]);

  const fetchWithdrawalHistory = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authApi.get('/api/withdrawal/history');
      
      if (response.success) {
        // The backend returns { withdrawals: [], total, page, limit, totalPages }
        // We need to access the withdrawals array specifically
        setTransactions(response.data?.withdrawals || []);
      } else {
        setError(response.message || 'Failed to fetch withdrawal history');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch withdrawal history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600" />;
      case 'FAILED':
      case 'CANCELLED':
        return <IoCloseCircleOutline className="w-5 h-5 text-red-600" />;
      case 'PROCESSING':
        return <IoHourglassOutline className="w-5 h-5 text-blue-600" />;
      default:
        return <IoTimeOutline className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAccountNumber = (accountNumber: string) => {
    return accountNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
              <IoTimeOutline className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Withdrawal History</h2>
              <p className="text-sm text-gray-600">Track your withdrawal transactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading withdrawal history...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <IoCloseCircleOutline className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchWithdrawalHistory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <IoCardOutline className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No withdrawal history found</p>
              <p className="text-sm text-gray-500">Your withdrawal transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(transaction.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            ₦{transaction.amount.toLocaleString()}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <IoCardOutline className="w-4 h-4" />
                            <span>{transaction.bankName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IoCalendarOutline className="w-4 h-4" />
                            <span>{formatDate(transaction.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600">
                          <p><strong>Account:</strong> {transaction.accountName}</p>
                          <p><strong>Number:</strong> {formatAccountNumber(transaction.accountNumber)}</p>
                          <p><strong>Reference:</strong> {transaction.reference}</p>
                          {transaction.narration && (
                            <p><strong>Narration:</strong> {transaction.narration}</p>
                          )}
                        </div>
                        
                        {transaction.processedAt && (
                          <div className="mt-2 text-xs text-gray-500">
                            Processed: {formatDate(transaction.processedAt)}
                          </div>
                        )}
                        
                        {transaction.failureReason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600">
                              <strong>Failure Reason:</strong> {transaction.failureReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}