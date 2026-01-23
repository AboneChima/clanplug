"use client";

import { useState, useEffect } from 'react';
import { 
  IoSearchOutline,
  IoFilterOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoEyeOutline,
  IoBanOutline,
  IoRefreshOutline
} from 'react-icons/io5';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  walletBalance: number;
  kycStatus: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  status: 'active' | 'suspended' | 'banned';
  joinedAt: string;
  lastActive: string;
}

type UserFilter = 'all' | 'active' | 'suspended' | 'banned' | 'verified' | 'unverified';

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<UserFilter>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        alert('Please login as admin first');
        return;
      }

      console.log('Fetching users from:', `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);
      
      // Fetch ALL users with high limit
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?limit=10000`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch users:', response.status, errorText);
        alert(`Failed to fetch users: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('Admin users response:', data);
      
      if (!data.success) {
        console.error('API returned error:', data.message);
        alert(`Error: ${data.message}`);
        return;
      }

      const usersData = data.data || [];
      console.log('Users data:', usersData);
      
      if (!Array.isArray(usersData)) {
        console.error('Users data is not an array:', usersData);
        return;
      }

      // Filter out hidden users
      const hiddenEmails = ['hackerfx@gmail.com'];
      const visibleUsers = usersData.filter((user: any) => !hiddenEmails.includes(user.email?.toLowerCase()));

      setUsers(visibleUsers.map((user: any) => {
        // Get wallet balance from wallets array
        const totalBalance = user.wallets?.reduce((sum: number, wallet: any) => {
          const balance = typeof wallet.balance === 'number' ? wallet.balance : parseFloat(wallet.balance || 0);
          return sum + balance;
        }, 0) || 0;
        
        // Get KYC status from kycVerifications array
        const latestKyc = user.kycVerifications?.[0];
        let kycStatus: 'verified' | 'pending' | 'rejected' | 'not_submitted' = 'not_submitted';
        if (latestKyc) {
          kycStatus = latestKyc.status === 'APPROVED' ? 'verified' : 
                     latestKyc.status === 'PENDING' ? 'pending' : 
                     latestKyc.status === 'REJECTED' ? 'rejected' : 'not_submitted';
        }
        
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          walletBalance: totalBalance,
          kycStatus,
          status: user.status?.toLowerCase() || 'active',
          joinedAt: user.createdAt,
          lastActive: user.lastLoginAt || user.createdAt
        };
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      alert(`Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    // Hide specific users
    const hiddenEmails = ['hackerfx@gmail.com', 'ogechui26@gmail.com'];
    if (hiddenEmails.includes(user.email.toLowerCase())) {
      return false;
    }

    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'verified' && user.kycStatus === 'verified') ||
                         (activeFilter === 'unverified' && user.kycStatus !== 'verified') ||
                         user.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const handleKycAction = async (userId: string, action: 'approve' | 'reject') => {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} this user's KYC?`)) return;

    try {
      const token = localStorage.getItem('accessToken');
      const user = users.find(u => u.id === userId);
      if (!user) {
        alert('User not found');
        return;
      }

      const endpoint = action === 'approve' ? 'verify' : 'reject';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kyc/${userId}/${endpoint}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(action === 'reject' ? { reason: 'Rejected by admin' } : {}),
      });

      if (response.ok) {
        alert(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Failed to update KYC status: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating KYC:', error);
      alert('Error updating KYC status');
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'ban') => {
    const actionMessages = {
      suspend: 'Suspend this user? They will not be able to login.',
      activate: 'Activate this user? They will be able to login again.',
      ban: 'Ban this user permanently? This action is severe.'
    };
    
    if (!confirm(actionMessages[action])) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      const statusMap = {
        suspend: 'SUSPENDED',
        activate: 'ACTIVE',
        ban: 'BANNED'
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: statusMap[action] }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ User ${action}d successfully!`);
        fetchUsers();
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      suspended: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      banned: 'bg-red-500/20 text-red-300 border-red-500/30',
      verified: 'bg-green-500/20 text-green-300 border-green-500/30',
      pending: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
      not_submitted: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };

    const labels: Record<string, string> = {
      active: 'Active',
      suspended: 'Suspended',
      banned: 'Banned',
      verified: 'Verified',
      pending: 'Pending',
      rejected: 'Rejected',
      not_submitted: 'Not Submitted'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Users Management</h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header - Compact on mobile */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white">Users</h1>
          <p className="hidden sm:block text-gray-400 mt-1">Manage platform users</p>
        </div>
        <button 
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          <IoRefreshOutline className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Search and Filters - Compact */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 pr-3 py-1.5 sm:py-2 w-full bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as UserFilter)}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        {/* Stats - Compact on mobile */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4">
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:p-3">
            <p className="text-base sm:text-xl font-bold text-white">{users.length}</p>
            <p className="text-[9px] sm:text-xs text-gray-400">Total</p>
          </div>
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:p-3">
            <p className="text-base sm:text-xl font-bold text-green-400">{users.filter(u => u.status === 'active').length}</p>
            <p className="text-[9px] sm:text-xs text-gray-400">Active</p>
          </div>
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:p-3">
            <p className="text-base sm:text-xl font-bold text-blue-400">{users.filter(u => u.kycStatus === 'verified').length}</p>
            <p className="text-[9px] sm:text-xs text-gray-400">Verified</p>
          </div>
          <div className="text-center bg-slate-800/50 rounded-lg p-2 sm:p-3">
            <p className="text-base sm:text-xl font-bold text-yellow-400">{users.filter(u => u.kycStatus === 'pending').length}</p>
            <p className="text-[9px] sm:text-xs text-gray-400">Pending</p>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 text-center">
            <IoPersonOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:bg-slate-800/30 transition-all duration-200">
              {/* User Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                    <IoPersonOutline className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">
                      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleViewUser(user)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-medium transition-colors border border-blue-500/30"
                >
                  <IoEyeOutline className="w-4 h-4" />
                  View
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Balance</p>
                  <p className="text-sm font-bold text-green-400">{formatCurrency(user.walletBalance)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wide">KYC Status</p>
                  <div className="mt-1">{getStatusBadge(user.kycStatus)}</div>
                </div>
              </div>

              {/* Actions Row */}
              {user.kycStatus === 'pending' && (
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-700/50">
                  <button
                    onClick={() => handleKycAction(user.id, 'approve')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs font-medium transition-colors border border-green-500/30"
                  >
                    <IoCheckmarkCircleOutline className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleKycAction(user.id, 'reject')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-500/30"
                  >
                    <IoCloseCircleOutline className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">User</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">Wallet Balance</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">KYC Status</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">Account Status</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">Last Active</th>
                <th className="text-left p-4 font-medium text-gray-400 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <IoPersonOutline className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-white text-sm">{formatCurrency(user.walletBalance)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user.kycStatus)}
                      {user.kycStatus === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleKycAction(user.id, 'approve')}
                            className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                            title="Approve KYC"
                          >
                            <IoCheckmarkCircleOutline className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleKycAction(user.id, 'reject')}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                            title="Reject KYC"
                          >
                            <IoCloseCircleOutline className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-400">{new Date(user.lastActive).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <IoEyeOutline className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                          title="Suspend User"
                        >
                          <IoWarningOutline className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Activate User"
                        >
                          <IoCheckmarkCircleOutline className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(user.id, 'ban')}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Ban User"
                      >
                        <IoBanOutline className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <IoPersonOutline className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowUserModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <IoCloseCircleOutline className="w-5 h-5" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <IoPersonOutline className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {selectedUser.firstName && selectedUser.lastName 
                      ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                      : selectedUser.username}
                  </h3>
                  <p className="text-xs text-gray-400">@{selectedUser.username}</p>
                </div>
              </div>

              {/* Details Grid - Compact */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">Email</p>
                  <p className="text-xs text-white break-all">{selectedUser.email}</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">Balance</p>
                  <p className="text-sm font-semibold text-green-400">{formatCurrency(selectedUser.walletBalance)}</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">KYC</p>
                  <div className="mt-1">{getStatusBadge(selectedUser.kycStatus)}</div>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">Joined</p>
                  <p className="text-xs text-white">{new Date(selectedUser.joinedAt).toLocaleDateString()}</p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">Last Active</p>
                  <p className="text-xs text-white">{new Date(selectedUser.lastActive).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs font-medium text-gray-400 mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.kycStatus === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleKycAction(selectedUser.id, 'approve');
                          setShowUserModal(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                      >
                        <IoCheckmarkCircleOutline className="w-3.5 h-3.5" />
                        Approve KYC
                      </button>
                      <button
                        onClick={() => {
                          handleKycAction(selectedUser.id, 'reject');
                          setShowUserModal(false);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                      >
                        <IoCloseCircleOutline className="w-3.5 h-3.5" />
                        Reject KYC
                      </button>
                    </>
                  )}
                  {selectedUser.status === 'active' ? (
                    <button
                      onClick={() => {
                        handleUserAction(selectedUser.id, 'suspend');
                        setShowUserModal(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-lg transition-colors"
                    >
                      <IoWarningOutline className="w-3.5 h-3.5" />
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleUserAction(selectedUser.id, 'activate');
                        setShowUserModal(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                    >
                      <IoCheckmarkCircleOutline className="w-3.5 h-3.5" />
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleUserAction(selectedUser.id, 'ban');
                      setShowUserModal(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                  >
                    <IoBanOutline className="w-3.5 h-3.5" />
                    Ban
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}