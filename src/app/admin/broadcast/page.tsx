"use client";

import { useState, useEffect } from 'react';
import { 
  IoMegaphoneOutline,
  IoSendOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoSearchOutline,
  IoSparklesOutline,
  IoAddCircleOutline,
  IoTrashOutline,
  IoLinkOutline
} from 'react-icons/io5';

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  status: string;
}

interface ActionButton {
  text: string;
  link: string;
}

// Quick link presets for easy selection
const QUICK_LINKS = [
  { label: 'Terms & Conditions', path: '/terms' },
  { label: 'Profile Page', path: '/profile' },
  { label: 'KYC Verification', path: '/kyc' },
  { label: 'Wallet', path: '/wallet' },
  { label: 'Marketplace', path: '/marketplace' },
  { label: 'Help & Support', path: '/help' },
  { label: 'Airtime & Data', path: '/vtu' },
];

export default function AdminBroadcastPage() {
  const [activeTab, setActiveTab] = useState<'single' | 'broadcast'>('broadcast');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showQuickLinks, setShowQuickLinks] = useState(false);
  
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    actionButton: null as ActionButton | null
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('Please login as admin first');
        window.location.href = '/admin-login';
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?limit=10000`, {
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
      const usersData = data.data || [];
      setUsers(usersData);
    } catch (error: any) {
      console.error('❌ Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) return;
    
    // Confirmation dialog
    const targetUsers = activeTab === 'single' && selectedUsers.length > 0 
      ? selectedUsers 
      : undefined;
    
    const confirmMessage = targetUsers 
      ? `Send to ${selectedUsers.length} selected user${selectedUsers.length !== 1 ? 's' : ''}?`
      : `Send to ALL ${users.length} users?`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      setSending(true);
      const token = localStorage.getItem('accessToken');
      
      const payload: any = {
        title: broadcastForm.title,
        message: broadcastForm.message,
        targetUsers
      };

      // Add action button if provided
      if (broadcastForm.actionButton?.text && broadcastForm.actionButton?.link) {
        payload.actionButton = broadcastForm.actionButton;
      }
      
      console.log('📤 Sending broadcast:', payload);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/broadcast`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to send broadcast');
        return;
      }

      const data = await response.json();
      const sentCount = data.data?.sentTo || data.sentTo || (targetUsers ? selectedUsers.length : users.length);
      setSuccessMessage(`✅ Broadcast sent to ${sentCount} user${sentCount !== 1 ? 's' : ''}!`);
      setShowSuccess(true);
      
      // Reset form
      setBroadcastForm({ title: '', message: '', actionButton: null });
      setSelectedUsers([]);
      
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error: any) {
      console.error('Failed to send broadcast:', error);
      alert('Failed to send broadcast notification');
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const addActionButton = () => {
    setBroadcastForm(prev => ({
      ...prev,
      actionButton: { text: '', link: '' }
    }));
  };

  const removeActionButton = () => {
    setBroadcastForm(prev => ({
      ...prev,
      actionButton: null
    }));
    setShowQuickLinks(false);
  };

  const selectQuickLink = (quickLink: typeof QUICK_LINKS[0]) => {
    setBroadcastForm(prev => ({
      ...prev,
      actionButton: {
        text: prev.actionButton?.text || `View ${quickLink.label}`,
        link: quickLink.path
      }
    }));
    setShowQuickLinks(false);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <IoCheckmarkCircleOutline className="w-6 h-6" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <IoMegaphoneOutline className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Broadcast System</h1>
            <p className="text-gray-400 mt-1">Send TikTok-style system announcements to users</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'broadcast'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <IoMegaphoneOutline className="w-5 h-5" />
            <span>Broadcast All</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'single'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <IoPersonOutline className="w-5 h-5" />
            <span>Message User</span>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Message Form */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <IoSparklesOutline className="w-5 h-5 text-yellow-400" />
              Compose Message
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="e.g., 🎉 New Feature Alert!"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none"
                  placeholder="Write your announcement here... Use emojis to make it engaging! 🚀"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {broadcastForm.message.length} characters
                </p>
              </div>

              {/* Action Button Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Action Button (Optional)
                  </label>
                  {!broadcastForm.actionButton ? (
                    <button
                      onClick={addActionButton}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <IoAddCircleOutline className="w-4 h-4" />
                      Add Button
                    </button>
                  ) : (
                    <button
                      onClick={removeActionButton}
                      className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                    >
                      <IoTrashOutline className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
                
                {broadcastForm.actionButton && (
                  <div className="space-y-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <input
                      type="text"
                      value={broadcastForm.actionButton.text}
                      onChange={(e) => setBroadcastForm(prev => ({
                        ...prev,
                        actionButton: { ...prev.actionButton!, text: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Button text (e.g., View Terms)"
                    />
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={broadcastForm.actionButton.link}
                        onChange={(e) => setBroadcastForm(prev => ({
                          ...prev,
                          actionButton: { ...prev.actionButton!, link: e.target.value }
                        }))}
                        onFocus={() => setShowQuickLinks(true)}
                        className="w-full px-3 py-2 pr-10 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Link (e.g., /terms)"
                      />
                      <button
                        onClick={() => setShowQuickLinks(!showQuickLinks)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <IoLinkOutline className="w-4 h-4" />
                      </button>
                      
                      {/* Quick Links Dropdown */}
                      {showQuickLinks && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <p className="text-xs text-gray-400 px-2 py-1 font-medium">Quick Links</p>
                            {QUICK_LINKS.map((link) => (
                              <button
                                key={link.path}
                                onClick={() => selectQuickLink(link)}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-between group"
                              >
                                <span>{link.label}</span>
                                <span className="text-xs text-gray-500 group-hover:text-blue-400">{link.path}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-blue-300">
                      💡 Click the link icon for quick page selection
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={sendBroadcast}
            disabled={sending || !broadcastForm.title || !broadcastForm.message}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <IoSendOutline className="w-5 h-5" />
                {activeTab === 'broadcast' 
                  ? `Send to All Users (${users.length})`
                  : `Send to ${selectedUsers.length} Selected User${selectedUsers.length !== 1 ? 's' : ''}`
                }
              </>
            )}
          </button>
        </div>

        {/* Right Column - Preview or User Selection */}
        {activeTab === 'single' ? (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <IoPersonOutline className="w-5 h-5 text-blue-400" />
                Select Users
              </h2>
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 w-full bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Selected Count */}
            {selectedUsers.length > 0 && (
              <div className="mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}

            {/* User List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <IoPersonOutline className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No users found</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedUsers.includes(user.id)
                        ? 'bg-blue-500/20 border-2 border-blue-500'
                        : 'bg-slate-900/50 border-2 border-transparent hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">{user.username}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <IoCheckmarkCircleOutline className="w-6 h-6 text-blue-400" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
            
            {/* TikTok-Style Preview */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
              {broadcastForm.title || broadcastForm.message ? (
                <div>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center">
                      <IoSparklesOutline className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white text-center mb-3">
                    {broadcastForm.title || 'Notification Title'}
                  </h3>
                  <div className="bg-white/5 rounded-xl p-4 mb-4">
                    <p className="text-sm text-white/90 text-center">
                      {broadcastForm.message || 'Your message will appear here...'}
                    </p>
                  </div>
                  {broadcastForm.actionButton?.text && broadcastForm.actionButton?.link && (
                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold mb-2">
                      {broadcastForm.actionButton.text}
                    </button>
                  )}
                  <button className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold">
                    {broadcastForm.actionButton ? 'Maybe Later' : 'Got it!'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <IoSparklesOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Start typing to see preview</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <p className="text-sm text-purple-300 font-medium">
                📊 Will be sent to {users.length} users
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8);
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
