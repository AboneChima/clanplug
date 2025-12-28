"use client";

import { useState, useEffect } from 'react';
import { 
  IoShieldCheckmarkOutline,
  IoSearchOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoAddOutline,
  IoRefreshOutline,
  IoCalendarOutline,
  IoPersonOutline
} from 'react-icons/io5';

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface VerificationBadge {
  id: string;
  userId: string;
  status: string;
  purchasedAt: string;
  expiresAt: string;
  user: User;
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationBadge[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [days, setDays] = useState('60');
  const [processing, setProcessing] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        alert('Please login as admin first');
        window.location.href = '/admin-login';
        return;
      }

      console.log('🔍 Fetching users for verification...');
      
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
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          window.location.href = '/admin-login';
        }
        return;
      }

      const data = await response.json();
      
      if (!data.success) {
        console.error('API returned error:', data.message);
        return;
      }

      const usersData = data.data || [];
      console.log('✅ Fetched users:', usersData.length);
      setUsers(usersData);
    } catch (error: any) {
      console.error('❌ Failed to fetch users:', error);
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        window.location.href = '/admin-login';
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/verifications`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          window.location.href = '/admin-login';
        }
        return;
      }

      const data = await response.json();
      setVerifications(data.data || data || []);
    } catch (error: any) {
      console.error('Failed to fetch verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyUser = async () => {
    if (!selectedUser || !days) return;
    
    try {
      setProcessing(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/verifications/verify`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          days: parseInt(days)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to verify user');
        return;
      }
      
      alert(`✅ ${selectedUser.username} verified for ${days} days!`);
      setShowVerifyModal(false);
      setSelectedUser(null);
      setDays('60');
      fetchVerifications();
    } catch (error) {
      console.error('Failed to verify user:', error);
      alert('Failed to verify user');
    } finally {
      setProcessing(false);
    }
  };

  const removeVerification = async (userId: string, username: string) => {
    if (!confirm(`Remove verification from ${username}?`)) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/verifications/${userId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        alert('Failed to remove verification');
        return;
      }

      alert(`✅ Verification removed from ${username}`);
      fetchVerifications();
    } catch (error) {
      console.error('Failed to remove verification:', error);
      alert('Failed to remove verification');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchVerifications();
    fetchUsers();
  }, []);

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
              <IoShieldCheckmarkOutline className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Verification Management</h1>
              <p className="text-gray-400">Manage user verification badges</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchVerifications}
              className="px-4 py-2 bg-slate-800 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <IoRefreshOutline className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowVerifyModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <IoAddOutline className="w-4 h-4" />
              Verify User
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Verified</p>
                <p className="text-2xl font-bold text-white">{verifications.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <IoShieldCheckmarkOutline className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Badges</p>
                <p className="text-2xl font-bold text-green-400">
                  {verifications.filter(v => getDaysRemaining(v.expiresAt) > 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <IoCheckmarkCircleOutline className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-red-400">
                  {verifications.filter(v => getDaysRemaining(v.expiresAt) <= 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <IoCloseCircleOutline className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verifications List */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            Verified Users ({verifications.length})
          </h2>
        </div>
        
        <div className="divide-y divide-slate-700">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading verifications...</p>
            </div>
          ) : verifications.length === 0 ? (
            <div className="p-8 text-center">
              <IoShieldCheckmarkOutline className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No verified users yet</p>
            </div>
          ) : (
            verifications.map((verification) => {
              const daysRemaining = getDaysRemaining(verification.expiresAt);
              const isExpired = daysRemaining <= 0;
              const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

              return (
                <div
                  key={verification.id}
                  className="p-6 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {verification.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-white">
                            {verification.user.username}
                          </h3>
                          <IoShieldCheckmarkOutline className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-sm text-gray-400">{verification.user.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <IoCalendarOutline className="w-4 h-4" />
                            Expires: {formatDate(verification.expiresAt)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isExpired 
                              ? 'bg-red-500/20 text-red-400'
                              : isExpiringSoon
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {isExpired 
                              ? 'Expired'
                              : `${daysRemaining} days left`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeVerification(verification.userId, verification.user.username)}
                      className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <IoCloseCircleOutline className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Verify User Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Verify User</h3>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 text-gray-400 hover:text-white rounded-lg"
              >
                <IoCloseCircleOutline className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search User ({users.length} total)
                </label>
                <div className="relative">
                  <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                  />
                </div>
              </div>

              {searchQuery && (
                <div className="max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No users found</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                        }}
                        className="w-full p-3 hover:bg-slate-800 transition-colors text-left flex items-center gap-3"
                      >
                        <IoPersonOutline className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-white">{user.username}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedUser && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm font-medium text-white">Selected User:</p>
                  <p className="text-sm text-gray-300">{selectedUser.username} ({selectedUser.email})</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Duration (Days)
                </label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                  placeholder="60"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Common: 30 days, 60 days, 365 days (1 year), 5475 days (15 years)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={verifyUser}
                disabled={processing || !selectedUser || !days}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircleOutline className="w-4 h-4" />
                    Verify User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
