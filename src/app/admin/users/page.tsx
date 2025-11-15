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

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setUsers([
        {
          id: '1',
          username: 'gamer123',
          email: 'gamer123@email.com',
          firstName: 'John',
          lastName: 'Doe',
          walletBalance: 25000,
          kycStatus: 'verified',
          status: 'active',
          joinedAt: '2024-01-15',
          lastActive: '2024-01-20'
        },
        {
          id: '2',
          username: 'player456',
          email: 'player456@email.com',
          firstName: 'Jane',
          lastName: 'Smith',
          walletBalance: 15000,
          kycStatus: 'pending',
          status: 'active',
          joinedAt: '2024-01-18',
          lastActive: '2024-01-19'
        },
        {
          id: '3',
          username: 'trader789',
          email: 'trader789@email.com',
          walletBalance: 0,
          kycStatus: 'not_submitted',
          status: 'suspended',
          joinedAt: '2024-01-10',
          lastActive: '2024-01-12'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'verified' && user.kycStatus === 'verified') ||
                         (activeFilter === 'unverified' && user.kycStatus !== 'verified') ||
                         user.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const handleKycAction = (userId: string, action: 'approve' | 'reject') => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, kycStatus: action === 'approve' ? 'verified' : 'rejected' }
        : user
    ));
  };

  const handleUserAction = (userId: string, action: 'suspend' | 'activate' | 'ban') => {
    const newStatus = action === 'suspend' ? 'suspended' : action === 'ban' ? 'banned' : 'active';
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: newStatus }
        : user
    ));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      banned: 'bg-red-100 text-red-800 border-red-200',
      verified: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      not_submitted: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status.replace('_', ' ').toUpperCase()}
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
          <h1 className="text-2xl font-bold text-foreground">Users Management</h1>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground mt-1">Manage all platform users and their verification status</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-foreground text-white rounded-lg hover:bg-brand-foreground/90 transition-colors">
          <IoRefreshOutline className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-foreground/20 focus:border-brand-foreground"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <IoFilterOutline className="w-4 h-4 text-muted-foreground" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as UserFilter)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-foreground/20 focus:border-brand-foreground"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="verified">KYC Verified</option>
              <option value="unverified">KYC Unverified</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{users.filter(u => u.status === 'active').length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{users.filter(u => u.kycStatus === 'verified').length}</p>
            <p className="text-sm text-muted-foreground">KYC Verified</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{users.filter(u => u.kycStatus === 'pending').length}</p>
            <p className="text-sm text-muted-foreground">KYC Pending</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Wallet Balance</th>
                <th className="text-left p-4 font-medium text-muted-foreground">KYC Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Account Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Last Active</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-background/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-foreground/10 rounded-full flex items-center justify-center">
                        <IoPersonOutline className="w-5 h-5 text-brand-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-foreground">{formatCurrency(user.walletBalance)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(user.kycStatus)}
                      {user.kycStatus === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleKycAction(user.id, 'approve')}
                            className="p-1 text-green-500 hover:bg-green-50 rounded"
                            title="Approve KYC"
                          >
                            <IoCheckmarkCircleOutline className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleKycAction(user.id, 'reject')}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
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
                    <p className="text-sm text-muted-foreground">{new Date(user.lastActive).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <IoEyeOutline className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Suspend User"
                        >
                          <IoWarningOutline className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activate User"
                        >
                          <IoCheckmarkCircleOutline className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(user.id, 'ban')}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
            <IoPersonOutline className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}