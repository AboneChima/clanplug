"use client";

import { useState, useEffect } from 'react';
import { 
  IoPersonOutline, 
  IoShieldCheckmarkOutline,
  IoRefreshOutline,
  IoTrendingUpOutline,
  IoWalletOutline,
  IoDocumentTextOutline
} from 'react-icons/io5';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  kycPending: number;
  kycApproved: number;
  kycRejected: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    kycPending: 0,
    kycApproved: 0,
    kycRejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/list?status=PENDING`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/list?status=APPROVED`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/admin/list?status=REJECTED`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const pending = pendingRes.ok ? (await pendingRes.json()).data || [] : [];
      const approved = approvedRes.ok ? (await approvedRes.json()).data || [] : [];
      const rejected = rejectedRes.ok ? (await rejectedRes.json()).data || [] : [];

      setStats({
        totalUsers: pending.length + approved.length + rejected.length,
        kycPending: Array.isArray(pending) ? pending.length : 0,
        kycApproved: Array.isArray(approved) ? approved.length : 0,
        kycRejected: Array.isArray(rejected) ? rejected.length : 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Overview of your platform</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          <IoRefreshOutline className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Submissions */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <IoPersonOutline className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Submissions</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>

        {/* KYC Pending */}
        <Link href="/admin/kyc" className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4 sm:p-5 hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <IoShieldCheckmarkOutline className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">KYC Pending</p>
          <p className="text-2xl sm:text-3xl font-bold text-orange-400">{stats.kycPending}</p>
        </Link>

        {/* KYC Approved */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <IoShieldCheckmarkOutline className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">KYC Approved</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-400">{stats.kycApproved}</p>
        </div>

        {/* KYC Rejected */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <IoShieldCheckmarkOutline className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">KYC Rejected</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-400">{stats.kycRejected}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Link
            href="/admin/kyc"
            className="flex items-center gap-3 p-3 sm:p-4 border border-slate-800 rounded-lg hover:bg-slate-800/50 hover:border-blue-500/30 transition-all group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <IoShieldCheckmarkOutline className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm sm:text-base">Review KYC Submissions</p>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{stats.kycPending} pending reviews</p>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-3 sm:p-4 border border-slate-800 rounded-lg hover:bg-slate-800/50 hover:border-purple-500/30 transition-all group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <IoPersonOutline className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm sm:text-base">Manage Users</p>
              <p className="text-xs sm:text-sm text-gray-400 truncate">View all users</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
