"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth-api';
import { 
  IoSendOutline, 
  IoWalletOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoCloseCircleOutline,
  IoRefreshOutline,
  IoArrowForwardOutline,
  IoPersonOutline,
  IoMailOutline
} from 'react-icons/io5';

interface WalletBalance {
  currency: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
  description: string;
  metadata?: {
    recipient?: {
      username?: string;
      email?: string;
    };
    senderId?: string;
    senderName?: string;
    recipientName?: string;
    direction?: 'credit' | 'debit';
    transferType?: string;
  };
}

export default function InternalTransfer() {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('NGN');
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [recipientType, setRecipientType] = useState<'email' | 'wallet'>('email');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const loadWallets = async () => {
    if (!accessToken) return;
    try {
      const response = await authApi.get('/api/wallets/balances');
      if (response.success) {
        const balanceData = Object.entries(response.data.balances).map(([currency, balance]) => ({
          currency,
          balance: balance as number
        }));
        setWallets(balanceData);
        if (balanceData.length > 0 && !selectedCurrency) {
          setSelectedCurrency(balanceData[0].currency);
        }
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadTransactions = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await authApi.get('/api/wallets/transactions?limit=20');
      if (response.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTransfer = async () => {
    if (!accessToken || !selectedCurrency || !amount || !recipient) return;
    
    setError('');
    setSuccess('');
    setSending(true);
    
    try {
      const response = await authApi.transferToUser(
        recipient.trim(),
        parseFloat(amount),
        selectedCurrency,
        description.trim() || `Transfer to ${recipient.trim()}`
      );
      
      if (response.success) {
        setAmount('');
        setRecipient('');
        setDescription('');
        setSuccess(`Successfully sent ${formatCurrency(parseFloat(amount), selectedCurrency)} to ${recipient}`);
        loadTransactions();
        loadWallets(); // Refresh balances
      }
    } catch (error: any) {
      console.error('Failed to send transfer:', error);
      setError(error.response?.data?.message || 'Failed to send transfer. Please try again.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadWallets();
    loadTransactions();
  }, [accessToken]);

  const selectedWallet = wallets.find(w => w.currency === selectedCurrency);
  const canSend = selectedWallet && parseFloat(amount) > 0 && parseFloat(amount) <= selectedWallet.balance && recipient.trim();

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'TRANSFER') {
      // Check if it's a sent or received transfer based on metadata
      const isReceived = transaction.metadata?.senderId;
      return isReceived ? (
        <IoWalletOutline className="w-6 h-6 text-green-600" />
      ) : (
        <IoSendOutline className="w-6 h-6 text-blue-600" />
      );
    }
    return <IoWalletOutline className="w-6 h-6 text-gray-600" />;
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.type === 'TRANSFER') {
      const isReceived = transaction.metadata?.senderId;
      if (isReceived) {
        // For received transfers, show sender name from metadata
        const senderName = transaction.metadata?.senderName || 
                          transaction.metadata?.senderId || 
                          'Unknown User';
        return `Money received from ${senderName}`;
      } else {
        // For sent transfers, show recipient name
        const recipientName = transaction.metadata?.recipientName ||
                             transaction.metadata?.recipient?.username || 
                             transaction.metadata?.recipient?.email || 
                             'Unknown User';
        return `Money sent to ${recipientName}`;
      }
    }
    return transaction.description;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tab Navigation - Clean and simple */}
      <div className="flex bg-gray-50 rounded-lg p-0.5 sm:p-1 mb-3 sm:mb-4">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex-1 py-1.5 sm:py-2 md:py-2.5 px-2 sm:px-3 md:px-4 rounded-md text-[10px] sm:text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'send'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          <IoSendOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 inline mr-0.5 sm:mr-1" />
          Send
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 sm:py-2 md:py-2.5 px-2 sm:px-3 md:px-4 rounded-md text-[10px] sm:text-xs md:text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600'
          }`}
        >
          <IoRefreshOutline className="w-4 h-4 inline mr-1.5" />
          History
        </button>
      </div>

      {activeTab === 'send' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-xs sm:text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-xs sm:text-sm">{success}</p>
            </div>
          )}

          {/* Currency Selection - Compact for Extra Small */}
          <div className="mb-2 xs:mb-2.5 sm:mb-3 md:mb-4">
            <label className="block text-[10px] xs:text-xs sm:text-sm font-semibold text-gray-900 mb-1 xs:mb-1.5 sm:mb-2">
              Currency
            </label>
            <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
              {wallets.filter(wallet => wallet.currency === 'NGN' || wallet.currency === 'USD').map((wallet) => (
                <button
                  key={wallet.currency}
                  onClick={() => setSelectedCurrency(wallet.currency)}
                  className={`p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-md xs:rounded-lg border border-2 transition-all ${
                    selectedCurrency === wallet.currency
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 text-[11px] xs:text-xs sm:text-sm">{wallet.currency}</p>
                    <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 mt-0.5 xs:mt-1">{formatCurrency(wallet.balance, wallet.currency)}</p>
                  </div>
                </button>
              ))}
              {wallets.filter(wallet => wallet.currency === 'NGN' || wallet.currency === 'USD').length === 0 && (
                <div className="p-2 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl border-2 border-gray-200 bg-gray-50">
                  <p className="text-gray-600 text-center text-[10px] xs:text-xs sm:text-sm">No wallet found. Please fund your wallet first.</p>
                </div>
              )}
            </div>
          </div>

          {/* Amount Input - Compact for Extra Small */}
          <div className="mb-2 xs:mb-2.5 sm:mb-3 md:mb-4">
            <label className="block text-[10px] xs:text-xs sm:text-sm font-semibold text-gray-900 mb-1 xs:mb-1.5 sm:mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-2 xs:px-2.5 sm:px-3 md:px-4 py-2 xs:py-2.5 sm:py-3 text-sm xs:text-base sm:text-lg font-semibold text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-md xs:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {selectedCurrency && (
                <div className="absolute right-2 xs:right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                  <span className="bg-gray-100 text-gray-700 px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 rounded-md xs:rounded-lg text-[10px] xs:text-xs sm:text-sm font-medium">
                    {selectedCurrency}
                  </span>
                </div>
              )}
            </div>
            {selectedWallet && amount && parseFloat(amount) > selectedWallet.balance && (
              <p className="text-[10px] xs:text-xs sm:text-sm text-red-600 mt-1 xs:mt-1.5 sm:mt-2">
                Insufficient balance. Available: {formatCurrency(selectedWallet.balance, selectedCurrency)}
              </p>
            )}
          </div>

          {/* Recipient Input */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
              Recipient
            </label>
            <div className="mb-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => setRecipientType('email')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    recipientType === 'email'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Email/Username
                </button>
                <button
                  onClick={() => setRecipientType('wallet')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    recipientType === 'wallet'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Wallet
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {recipientType === 'email' ? (
                  recipient.includes('@') ? (
                    <IoMailOutline className="w-4 h-4 text-gray-400" />
                  ) : (
                    <IoPersonOutline className="w-4 h-4 text-gray-400" />
                  )
                ) : (
                  <IoWalletOutline className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={
                  recipientType === 'email' 
                    ? "Username or email"
                    : "Wallet address"
                }
                className="w-full pl-10 pr-4 py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {recipientType === 'wallet' && (
              <p className="text-xs text-gray-500 mt-2">
                Enter a valid wallet address or username for internal transfers
              </p>
            )}
          </div>

          {/* Transfer Preview with Fee */}
          {amount && parseFloat(amount) > 0 && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Transfer amount:</span>
                <span className="font-medium text-blue-900">
                  {formatCurrency(parseFloat(amount), selectedCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Platform fee (0.5%):</span>
                <span className="font-medium text-blue-900">
                  -{formatCurrency(parseFloat(amount) * 0.005, selectedCurrency)}
                </span>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-700">Recipient receives:</span>
                  <span className="font-bold text-base text-blue-900">
                    {formatCurrency(parseFloat(amount) * 0.995, selectedCurrency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Note (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for?"
              className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={sendTransfer}
            disabled={sending || !canSend}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <IoArrowForwardOutline className="w-5 h-5" />
                Send Money
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            <button
              onClick={loadTransactions}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
            >
              <IoRefreshOutline className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Transaction History */}
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <IoWalletOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No transactions yet</p>
                <p className="text-gray-500 text-sm">Your transfer history will appear here</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === 'TRANSFER' && transaction.metadata?.senderId ? 'bg-green-100' : 
                        transaction.type === 'TRANSFER' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {getTransactionIcon(transaction)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {getTransactionDescription(transaction)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-lg ${
                        transaction.metadata?.senderId ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.metadata?.senderId ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status === 'COMPLETED' && <IoCheckmarkCircleOutline className="w-3 h-3" />}
                        {transaction.status === 'PENDING' && <IoTimeOutline className="w-3 h-3" />}
                        {transaction.status === 'FAILED' && <IoCloseCircleOutline className="w-3 h-3" />}
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}