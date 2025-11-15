"use client";

import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/auth-api';
import { 
  IoCopyOutline, 
  IoCheckmarkOutline, 
  IoTimeOutline, 
  IoWalletOutline,
  IoRefreshOutline,
  IoCloseOutline
} from 'react-icons/io5';

interface CryptoCurrency {
  currency: string;
  name: string;
  min_amount: number;
}

interface CryptoPayment {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  priceAmount: number;
  priceCurrency: string;
  paymentUrl?: string;
  expiresAt?: string;
}

interface CryptoDepositProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CryptoDeposit({ isOpen, onClose, onSuccess }: CryptoDepositProps) {
  const [step, setStep] = useState<'form' | 'payment' | 'confirmation'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [payCurrency, setPayCurrency] = useState('BTC');
  const [description, setDescription] = useState('');
  
  // Crypto data
  const [cryptoCurrencies, setCryptoCurrencies] = useState<CryptoCurrency[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [payment, setPayment] = useState<CryptoPayment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('waiting');
  
  // UI state
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Load crypto currencies on mount
  useEffect(() => {
    if (isOpen) {
      loadCryptoCurrencies();
    }
  }, [isOpen]);

  // Timer for payment expiration
  useEffect(() => {
    if (payment?.expiresAt && step === 'payment') {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(payment.expiresAt!).getTime();
        const remaining = Math.max(0, expiry - now);
        
        setTimeLeft(Math.floor(remaining / 1000));
        
        if (remaining <= 0) {
          setError('Payment expired. Please create a new payment.');
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [payment, step]);

  const loadCryptoCurrencies = async () => {
    try {
      console.log('🔄 Loading crypto currencies...');
      const response = await authApi.getCryptoCurrencies();
      console.log('📡 Crypto currencies response:', response);
      
      // Check if response exists and has the expected structure
      if (!response) {
        console.error('❌ No response received from crypto currencies API');
        return;
      }
      
      // The API client returns ApiResponse<T> where success is at the top level
      if (response.success) {
        const currencies = response.data;
        if (currencies && Array.isArray(currencies)) {
          console.log(`✅ Loaded ${currencies.length} cryptocurrencies`);
          setCryptoCurrencies(currencies);
          if (currencies.length > 0) {
            // Use 'code' field if 'currency' field doesn't exist
            const firstCurrency = currencies[0].currency || currencies[0].code;
            setPayCurrency(firstCurrency);
            console.log(`🎯 Default pay currency set to: ${firstCurrency}`);
          }
        } else {
          console.error('❌ Invalid currencies data format:', currencies);
        }
      } else {
        const errorMessage = response.message || 'Unknown error occurred';
        console.error('❌ Failed to load crypto currencies:', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error loading crypto currencies:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
  };

  const getEstimate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      setLoading(true);
      const response = await authApi.getCryptoEstimate(
        parseFloat(amount),
        currency,
        payCurrency
      );
      
      if (response.data.success) {
        setEstimate(response.data.data);
      }
    } catch (error) {
      console.error('Error getting estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      
      const response = await authApi.initiateCryptoDeposit(
        parseFloat(amount),
        currency,
        payCurrency,
        description || `Wallet deposit - ${amount} ${currency}`
      );
      
      if (response.data.success) {
        setPayment(response.data.data);
        setStep('payment');
        setPaymentStatus('waiting');
      } else {
        setError(response.data.message || 'Failed to create payment');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [key]: true });
      setTimeout(() => {
        setCopied({ ...copied, [key]: false });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const checkPaymentStatus = async () => {
    if (!payment) return;
    
    try {
      setLoading(true);
      const response = await authApi.getCryptoPaymentStatus(payment.paymentId);
      
      if (response.data.success) {
        const status = response.data.data.payment_status;
        setPaymentStatus(status);
        
        if (status === 'finished') {
          setSuccess('Payment completed successfully!');
          setStep('confirmation');
          onSuccess?.();
        } else if (status === 'failed' || status === 'expired') {
          setError(`Payment ${status}. Please try again.`);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setStep('form');
    setPayment(null);
    setEstimate(null);
    setError(null);
    setSuccess(null);
    setAmount('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <IoWalletOutline className="mr-2" />
            Crypto Deposit
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {/* Step 1: Form */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Currency
                </label>
                <div className="flex space-x-2">
                  {['NGN', 'USD'].map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr as 'NGN' | 'USD')}
                      className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                        currency === curr
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={getEstimate}
                  placeholder={`Enter amount in ${currency}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                  required
                />
              </div>

              {/* Pay Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay with Cryptocurrency
                </label>
                <select
                  value={payCurrency}
                  onChange={(e) => setPayCurrency(e.target.value)}
                  onBlur={getEstimate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  {cryptoCurrencies.length === 0 ? (
                    <option value="">Loading cryptocurrencies...</option>
                  ) : (
                    cryptoCurrencies.map((crypto) => (
                      <option key={crypto.currency} value={crypto.currency}>
                        {crypto.name} ({crypto.currency})
                      </option>
                    ))
                  )}
                </select>
                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-1">
                  Debug: {cryptoCurrencies.length} currencies loaded
                </div>
              </div>

              {/* Estimate */}
              {estimate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Estimated Amount:</strong> {estimate.estimated_amount} {payCurrency}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Rate may change before payment completion
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Payment description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !amount}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Payment...' : 'Create Payment'}
              </button>
            </form>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && payment && (
            <div className="space-y-4">
              {/* Timer */}
              {timeLeft > 0 && (
                <div className="flex items-center justify-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <IoTimeOutline className="mr-2 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    Time remaining: {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {/* Payment Details */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Payment Details</h3>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Amount to Pay</p>
                  <p className="font-medium text-lg">{payment.payAmount} {payment.payCurrency}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Payment Address</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-mono text-sm break-all mr-2">{payment.payAddress}</p>
                    <button
                      onClick={() => copyToClipboard(payment.payAddress, 'address')}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {copied.address ? <IoCheckmarkOutline /> : <IoCopyOutline />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Payment ID</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-mono text-sm break-all mr-2">{payment.paymentId}</p>
                    <button
                      onClick={() => copyToClipboard(payment.paymentId, 'id')}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {copied.id ? <IoCheckmarkOutline /> : <IoCopyOutline />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong>
                </p>
                <ol className="text-sm text-blue-700 mt-1 list-decimal list-inside space-y-1">
                  <li>Send exactly <strong>{payment.payAmount} {payment.payCurrency}</strong> to the address above</li>
                  <li>Wait for blockchain confirmation</li>
                  <li>Your wallet will be credited automatically</li>
                </ol>
              </div>

              {/* Status */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Payment Status: <span className="font-medium capitalize">{paymentStatus}</span></p>
                <button
                  onClick={checkPaymentStatus}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <IoRefreshOutline className="mr-2" />
                  {loading ? 'Checking...' : 'Check Status'}
                </button>
              </div>

              {/* Payment URL */}
              {payment.paymentUrl && (
                <div className="text-center">
                  <a
                    href={payment.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Open in NowPayments →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <IoCheckmarkOutline size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Payment Completed!</h3>
              <p className="text-gray-600">Your wallet has been credited successfully.</p>
              <button
                onClick={handleClose}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}