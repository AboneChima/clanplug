"use client";

import { IoWalletOutline, IoCardOutline, IoSwapHorizontalOutline, IoTrendingUpOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoTimeOutline, IoArrowUpOutline, IoArrowDownOutline, IoRefreshOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import PageHeader from '@/components/PageHeader';
import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DepositModal from '@/components/wallet/DepositModal';
import InternalTransfer from '@/components/wallet/InternalTransfer';
import WalletAddresses from '@/components/wallet/WalletAddresses';
import WithdrawalModal from '@/components/wallet/WithdrawalModal';
import { useSearchParams } from 'next/navigation';
import { useVisibilityRefresh } from '@/hooks/usePageVisibility';

function WalletContent() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<{ connected: boolean; provider?: string; address?: string } | null>(null);
  const [balance, setBalance] = useState<Record<string, number> | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [showWalletAddresses, setShowWalletAddresses] = useState(false);
  const [paymentNotification, setPaymentNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch wallet status
      const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallets/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData ?? { connected: false });
      }
      
      // Fetch balance
      const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallets/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        console.log('Balance data:', balanceData); // Debug log
        // Backend returns { success: true, data: balances }
        setBalance(balanceData.data ?? balanceData ?? null);
      }
      
      // Fetch transactions
      const transactionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallets/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      // Reset states on error to prevent infinite loading
      setStatus({ connected: false });
      setBalance(null);
      setTransactions([]);
    }
    finally {
      setLoading(false);
    }
  };

  // Use visibility refresh hook to handle tab switching
  const { isVisible } = useVisibilityRefresh(load, [accessToken], {
    refreshOnVisible: true,
    refreshDelay: 1000,
    enabled: !!accessToken
  });

  // Handle case when there's no access token
  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      setStatus({ connected: false });
      setBalance(null);
      setTransactions([]);
    }
  }, [accessToken]);

  // Handle payment success/error from URL parameters
  useEffect(() => {
    const payment = searchParams.get('payment');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    const message = searchParams.get('message');

    if (payment === 'success') {
      setPaymentNotification({
        type: 'success',
        message: `Payment successful! ₦${amount} has been added to your ${currency} wallet.`
      });
      // Refresh balance after successful payment
      setTimeout(() => {
        load();
      }, 1000);
    } else if (payment === 'error') {
      setPaymentNotification({
        type: 'error',
        message: message ? decodeURIComponent(message) : 'Payment failed. Please try again.'
      });
    }

    // Clear notification after 10 seconds
    if (payment) {
      setTimeout(() => {
        setPaymentNotification(null);
        // Clear URL parameters
        window.history.replaceState({}, '', '/wallet');
      }, 10000);
    }
  }, [searchParams]);

  const handleConnect = async () => {
    if (!accessToken) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallets/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      await load();
    } catch {}
  };

  const handleDisconnect = async () => {
    if (!accessToken) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallets/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      await load();
    } catch {}
  };

  const handleWithdrawalSuccess = () => {
    // Refresh balance after successful withdrawal
    load();
    setWithdrawalModalOpen(false);
    setPaymentNotification({
      type: 'success',
      message: 'Withdrawal request submitted successfully! Your funds will be sent automatically.'
    });
  };

  const checkPendingPayments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Get pending transactions
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manual-verify/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const pending = data.data || [];
        
        if (pending.length > 0) {
          // Verify each pending transaction
          for (const tx of pending) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/manual-verify/payment`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ reference: tx.reference }),
            });
          }
          
          setPaymentNotification({
            type: 'success',
            message: `Verified ${pending.length} pending payment(s)! Your balance has been updated.`
          });
          
          // Refresh balance
          load();
        }
      }
    } catch (error) {
      console.error('Error checking pending payments:', error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'send':
      case 'withdraw':
        return <IoArrowUpOutline className="w-4 h-4 text-error" />;
      case 'receive':
      case 'deposit':
        return <IoArrowDownOutline className="w-4 h-4 text-success" />;
      default:
        return <IoSwapHorizontalOutline className="w-4 h-4 text-brand-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppShell>
      {/* Payment Notification */}
      {paymentNotification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-fade-in ${
          paymentNotification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {paymentNotification.type === 'success' ? (
              <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <IoCloseCircleOutline className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">{paymentNotification.message}</p>
            </div>
            <button
              onClick={() => setPaymentNotification(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IoCloseCircleOutline className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="mb-6 lg:mb-8 animate-fade-in">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl lg:rounded-3xl p-6 lg:p-8 xl:p-12 text-white shadow-2xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg flex-shrink-0">
                  <IoWalletOutline className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2">Wallet</h1>
                  <p className="text-sm sm:text-base lg:text-xl text-white/90 font-medium">Manage your digital assets</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={load}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 rounded-lg border border-white/30 text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  <IoRefreshOutline className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={checkPendingPayments}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg border border-green-400/30 text-green-300 text-sm font-medium transition-colors"
                  title="Check for pending payments"
                >
                  <IoCheckmarkCircleOutline className="w-4 h-4" />
                  <span className="hidden sm:inline">Verify</span>
                </button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <IoTrendingUpOutline className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
                  <span className="text-white/80 font-medium text-xs sm:text-sm">Balance</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {balance ? 
                    `₦${Object.values(balance).reduce((sum, amount) => sum + amount, 0).toLocaleString()}` : 
                    '₦0.00'
                  }
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <IoSwapHorizontalOutline className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                  <span className="text-white/80 font-medium text-xs sm:text-sm">Transactions</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">{transactions.length}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <IoCheckmarkCircleOutline className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300" />
                  <span className="text-white/80 font-medium text-xs sm:text-sm">Status</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Quick Actions Section */}
        <div className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in" style={{animationDelay: '0.1s'}}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 lg:mb-8">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg">
              <IoWalletOutline className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Quick Actions</h2>
              <p className="text-gray-600 font-medium text-sm lg:text-base">Manage your wallet and perform transactions</p>
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <button 
              onClick={() => setDepositModalOpen(true)}
              className="flex-1 flex flex-col items-center gap-1.5 p-3 sm:p-4 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white transition-all hover:scale-105 shadow-lg" 
            >
              <IoArrowDownOutline className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-semibold">Deposit</span>
            </button>
            
            <button 
              onClick={() => {
                setShowSendMoney(!showSendMoney);
                if (!showSendMoney) setShowWalletAddresses(false);
              }}
              className="flex-1 flex flex-col items-center gap-1.5 p-3 sm:p-4 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-white transition-all hover:scale-105 shadow-lg" 
            >
              <IoSwapHorizontalOutline className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-semibold">Transfer</span>
            </button>
            
            <button 
              onClick={() => {
                setShowWalletAddresses(!showWalletAddresses);
                if (!showWalletAddresses) setShowSendMoney(false);
              }}
              className="flex-1 flex flex-col items-center gap-1.5 p-3 sm:p-4 bg-gradient-to-br from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl text-white transition-all hover:scale-105 shadow-lg" 
            >
              <IoWalletOutline className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-semibold">Receive</span>
            </button>

            <button 
              onClick={() => setWithdrawalModalOpen(true)}
              className="flex-1 flex flex-col items-center gap-1.5 p-3 sm:p-4 bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl text-white transition-all hover:scale-105 shadow-lg" 
            >
              <IoArrowUpOutline className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-sm font-semibold">Withdraw</span>
            </button>
          </div>
        </div>

        {/* Send Money Section - Collapsible */}
        {showSendMoney && (
          <div className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in" style={{animationDelay: '0.15s'}}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 lg:mb-8">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <IoArrowUpOutline className="w-5 h-5 lg:w-6 lg:h-6 text-white rotate-45" />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Send Money</h2>
                <p className="text-gray-600 font-medium text-sm lg:text-base">Transfer money to other users instantly</p>
              </div>
            </div>
            
            <InternalTransfer />
          </div>
        )}

        {/* Wallet Addresses Section - Collapsible */}
        {showWalletAddresses && (
          <div className="bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <WalletAddresses />
          </div>
        )}

        {/* Balance and Transactions Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Balance Section */}
          <div className="card-modern p-4 sm:p-6 animate-fade-in hover:shadow-brand-lg transition-all duration-300" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-success/20 to-success/30 border border-success/30 flex items-center justify-center">
                <IoCardOutline className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-heading">Portfolio Balance</h3>
                <p className="text-xs sm:text-sm text-body">Your available digital assets</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {balance ? (
                Object.entries(balance).map(([currency, amount], index) => (
                  <div key={currency} className="card-gradient p-3 sm:p-4 hover:shadow-md transition-all duration-200 animate-fade-in" style={{animationDelay: `${0.3 + index * 0.1}s`}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-bold text-brand-500">{currency.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-semibold text-heading uppercase tracking-wider">{currency}</p>
                          <p className="text-xs sm:text-sm text-body">Available Balance</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg sm:text-xl font-bold text-heading">{amount.toLocaleString()}</p>
                        <p className="text-xs sm:text-sm text-body">{currency}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted/20 to-muted/10 border border-muted/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <IoCardOutline className="w-6 h-6 sm:w-8 sm:h-8 text-muted" />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-heading mb-2">No Balance Data</h4>
                  <p className="text-sm sm:text-base text-body">Connect your wallet to view your portfolio balance</p>
                </div>
              )}
            </div>
          </div>

          {/* Transactions Section */}
          <div className="card-modern p-4 sm:p-6 animate-fade-in hover:shadow-brand-lg transition-all duration-300" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-info/20 to-info/30 border border-info/30 flex items-center justify-center">
                  <IoSwapHorizontalOutline className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-heading">Recent Transactions</h3>
                  <p className="text-xs sm:text-sm text-body">Your latest wallet activity</p>
                </div>
              </div>
              <button 
                onClick={load}
                disabled={loading}
                className="btn-secondary flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm hover-lift"
              >
                {loading ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin"></div>
                ) : (
                  <IoRefreshOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {transactions.length > 0 ? (
                transactions.slice(0, 5).map((tx, index) => (
                  <div key={tx.id} className="card-gradient p-3 sm:p-4 hover:shadow-md transition-all duration-200 animate-fade-in" style={{animationDelay: `${0.4 + index * 0.05}s`}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center ${
                          tx.type === 'DEPOSIT' ? 'bg-success/10 border border-success/20' : 
                          tx.type === 'WITHDRAWAL' ? 'bg-destructive/10 border border-destructive/20' : 
                          'bg-info/10 border border-info/20'
                        }`}>
                          {tx.type === 'DEPOSIT' ? (
                            <IoArrowDownOutline className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                          ) : tx.type === 'WITHDRAWAL' ? (
                            <IoArrowUpOutline className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                          ) : (
                            <IoSwapHorizontalOutline className="w-3 h-3 sm:w-4 sm:h-4 text-info" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-medium text-heading truncate">
                            {tx.type === 'TRANSFER' && tx.metadata?.direction === 'credit' 
                              ? `Money received`
                              : tx.type === 'TRANSFER' && tx.metadata?.direction === 'debit'
                              ? `Money sent`
                              : tx.type
                            }
                          </p>
                          <p className="text-xs sm:text-sm text-body flex items-center gap-1">
                            <IoTimeOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="truncate">{formatDate(tx.createdAt)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm sm:text-base font-semibold ${
                          tx.type === 'DEPOSIT' ? 'text-green-600' : 
                          tx.type === 'WITHDRAWAL' ? 'text-red-600' : 
                          tx.metadata?.direction === 'credit' ? 'text-green-600' :
                          tx.metadata?.direction === 'debit' ? 'text-red-600' :
                          'text-heading'
                        }`}>
                          {tx.type === 'DEPOSIT' ? '+' : 
                           tx.type === 'WITHDRAWAL' ? '-' : 
                           tx.metadata?.direction === 'credit' ? '+' :
                           tx.metadata?.direction === 'debit' ? '-' : ''}
                          {tx.currency} {tx.amount}
                        </p>
                        {/* Show sender/receiver info for transfers */}
                        {tx.type === 'TRANSFER' && tx.metadata && (
                          <p className="text-xs text-body mt-1">
                            {tx.metadata.direction === 'credit' 
                              ? `From: ${tx.metadata.senderName || 'Unknown'}`
                              : `To: ${tx.metadata.recipientName || 'Unknown'}`
                            }
                          </p>
                        )}
                        <div className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                          tx.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                          tx.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {tx.status === 'COMPLETED' && <IoCheckmarkCircleOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                          {tx.status === 'PENDING' && <IoTimeOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                          {tx.status === 'FAILED' && <IoCloseCircleOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                          <span className="hidden sm:inline">{tx.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted/20 to-muted/10 border border-muted/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <IoSwapHorizontalOutline className="w-6 h-6 sm:w-8 sm:h-8 text-muted" />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-heading mb-2">No Transactions</h4>
                  <p className="text-sm sm:text-base text-body">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>

      {/* Modals */}
      <DepositModal 
        isOpen={depositModalOpen} 
        onClose={() => setDepositModalOpen(false)}
        onSuccess={() => {
          setDepositModalOpen(false);
          load(); // Refresh wallet data
        }}
      />
      
      <WithdrawalModal 
        isOpen={withdrawalModalOpen} 
        onClose={() => setWithdrawalModalOpen(false)}
        onSuccess={handleWithdrawalSuccess}
        balance={balance?.NGN || 0}
      />
    </AppShell>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WalletContent />
    </Suspense>
  );
}