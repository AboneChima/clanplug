'use client';

import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth-api';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  IoWalletOutline, 
  IoShieldCheckmarkOutline, 
  IoPhonePortraitOutline,
  IoDocumentTextOutline,
  IoAddOutline,
  IoCallOutline,
  IoCardOutline,
  IoSendOutline,
  IoReceiptOutline,
  IoSettingsOutline,
  IoCheckmarkCircleOutline,
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoTrendingUpOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoGiftOutline
} from 'react-icons/io5';
import { useVisibilityRefresh } from '@/hooks/usePageVisibility';

interface UserDashboardData {
  walletBalance: {
    total: number;
    byCurrency: Record<string, number>;
  };
  transactions: {
    total: number;
    thisMonth: number;
    successful: number;
    pending: number;
    recentTransactions: Array<{
      id: string;
      type: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: string;
      description?: string;
    }>;
  };
  posts: {
    total: number;
    active: number;
    sold: number;
    views: number;
    likes: number;
  };
  rewards: {
    points: number;
    level: string;
    nextLevelPoints: number;
  };
  activity: {
    lastLogin: string | null;
    accountAge: number;
    kycStatus: string;
    isVerified: boolean;
  };
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to get time-based greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const result = await authApi.get('/api/user/dashboard');
      if (result.success) {
        setDashboardData(result.data);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Use visibility refresh hook to handle tab switching
  const { isVisible } = useVisibilityRefresh(() => fetchDashboardData(false), [user], {
    refreshOnVisible: true,
    refreshDelay: 1000,
    enabled: !!user
  });

  // Initial fetch and handle case when there's no user
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setDashboardData(null);
    } else {
      fetchDashboardData(true);
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-12">
      {/* Personalized Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold">
              Good {getTimeOfDay()}, {user?.firstName || user?.username || 'User'}! 👋
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-blue-100 mt-1 sm:mt-2">
              Ready to manage your finances today?
            </p>
          </div>
          {user?.isKYCVerified && (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-green-800 bg-green-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-green-200 flex-shrink-0">
              <IoShieldCheckmarkOutline className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Account Verified</span>
              <span className="sm:hidden">Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Account Balance</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1">
                {loading ? (
                  <span className="inline-block w-20 sm:w-24 h-6 sm:h-8 bg-slate-700 animate-pulse rounded"></span>
                ) : (
                  formatCurrency(dashboardData?.walletBalance?.total || 0)
                )}
              </p>
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <IoTrendingUpOutline className="w-3 h-3" />
                {dashboardData?.transactions.thisMonth || 0} this month
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <IoWalletOutline className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Total Transactions</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1">
                {loading ? (
                  <span className="inline-block w-12 sm:w-16 h-6 sm:h-8 bg-slate-700 animate-pulse rounded"></span>
                ) : (
                  dashboardData?.transactions.total || 0
                )}
              </p>
              <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                <IoStatsChartOutline className="w-3 h-3" />
                {dashboardData?.transactions.successful || 0} successful
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <IoReceiptOutline className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Active Listings</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1">
                {loading ? (
                  <span className="inline-block w-12 sm:w-16 h-6 sm:h-8 bg-slate-700 animate-pulse rounded"></span>
                ) : (
                  dashboardData?.posts.active || 0
                )}
              </p>
              <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                <IoDocumentTextOutline className="w-3 h-3" />
                {dashboardData?.posts.views || 0} total views
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <IoDocumentTextOutline className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Rewards Points</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1">
                {loading ? (
                  <span className="inline-block w-12 sm:w-16 h-6 sm:h-8 bg-slate-700 animate-pulse rounded"></span>
                ) : (
                  dashboardData?.rewards.points || 0
                )}
              </p>
              <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                <IoGiftOutline className="w-3 h-3" />
                {dashboardData?.rewards.level || 'Bronze'} Level
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <IoGiftOutline className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Account Information */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">Account Information</h2>
              <Link href="/profile" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                Edit Profile
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Full Name</p>
                <p className="text-base sm:text-lg font-semibold text-white">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.username || 'Not set'}
                </p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Email</p>
                <p className="text-base sm:text-lg font-semibold text-white truncate">{user?.email}</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Phone</p>
                <p className="text-base sm:text-lg font-semibold text-white">{user?.phone || 'Not provided'}</p>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-gray-400">Member Since</p>
                <p className="text-base sm:text-lg font-semibold text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h3>
              <Link href="/wallet" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                View All
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 sm:p-4 bg-slate-700/50 rounded-lg animate-pulse">
                    <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : dashboardData?.transactions.recentTransactions && dashboardData.transactions.recentTransactions.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {dashboardData.transactions.recentTransactions.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'DEPOSIT' ? 'bg-green-500/20' : 
                        tx.type === 'WITHDRAWAL' ? 'bg-red-500/20' : 'bg-blue-500/20'
                      }`}>
                        {tx.type === 'DEPOSIT' ? (
                          <IoArrowDownOutline className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        ) : tx.type === 'WITHDRAWAL' ? (
                          <IoArrowUpOutline className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                        ) : (
                          <IoArrowUpOutline className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 rotate-45" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-semibold text-white truncate">{tx.type}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm sm:text-base font-bold ${
                        tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <IoTimeOutline className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                </div>
                <p className="text-sm sm:text-base text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-xl">
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Quick Actions</h3>
            <div className="space-y-2 sm:space-y-3">
              <Link href="/wallet" className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IoCardOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">Fund Wallet</span>
              </Link>
              <Link href="/wallet" className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IoSendOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">Send Money</span>
              </Link>
              <Link href="/vtu" className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IoPhonePortraitOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">VTU Services</span>
              </Link>
              <Link href="/settings" className="w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all duration-300">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IoSettingsOutline className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className="font-semibold text-xs sm:text-sm">Settings</span>
              </Link>
            </div>
          </div>

          {/* Security Status */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-xl">
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Security Status</h3>
            <div className="space-y-2 sm:space-y-3">
              {user?.isKYCVerified ? (
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                  <IoCheckmarkCircleOutline className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-green-300">KYC Verified</span>
                </div>
              ) : (
                <Link href="/kyc" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors">
                  <IoShieldCheckmarkOutline className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-yellow-300">Complete KYC</span>
                </Link>
              )}
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                <IoCheckmarkCircleOutline className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-green-300">Account Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}