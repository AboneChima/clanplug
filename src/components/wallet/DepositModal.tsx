"use client";

import { useState } from 'react';
import { IoClose, IoWallet, IoCard } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth-api';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDeposit = async () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    const numAmount = parseFloat(amount);
    const minAmount = 100; // Minimum 100 NGN
    if (numAmount < minAmount) {
      setError(`Minimum deposit amount is ₦${minAmount}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.initiateDeposit({
        amount: numAmount,
        currency: 'NGN',
        gateway: 'flutterwave',
        description: 'Wallet deposit via Flutterwave'
      });

      if (response.success) {
        setSuccess('Redirecting to payment page...');
        // Redirect to Flutterwave payment page
        window.location.href = response.data.authorizationUrl;
      } else {
        setError(response.message || 'Failed to initiate deposit');
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      setError(error.message || 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md animate-fade-in max-h-[95vh] overflow-y-auto">
        {/* Header - Compact on mobile */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <IoWallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">Fund Wallet</h2>
              <p className="text-xs sm:text-sm text-gray-600">Add money via Flutterwave</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <IoClose className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Form - Compact on mobile */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
          {/* Flutterwave Info - Compact on mobile */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-lg sm:rounded-xl p-2 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0">
                <IoCard className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-green-900 mb-0.5 sm:mb-1">Flutterwave Payment</h4>
                <p className="text-xs sm:text-sm text-green-700">
                  Deposit Nigerian Naira (NGN) directly to your wallet. Secure and instant.
                </p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                ₦
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="100"
                step="0.01"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-gray-900 placeholder-gray-400 bg-white"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: ₦100 • Funds will be added to your NGN wallet
            </p>
          </div>

          {/* Amount Preview */}
          {amount && parseFloat(amount) >= 100 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">You will receive:</span>
                <span className="font-semibold text-blue-900">
                  ₦{parseFloat(amount).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Amount will be added to your NGN wallet
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleDeposit}
            disabled={loading || !amount || parseFloat(amount) < 100}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <IoCard className="w-5 h-5" />
                Pay with Flutterwave
              </>
            )}
          </button>

          {/* Payment Methods */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Accepted payment methods:</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>Bank Transfer</span>
              <span>•</span>
              <span>Debit Card</span>
              <span>•</span>
              <span>USSD</span>
              <span>•</span>
              <span>Bank Account</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}