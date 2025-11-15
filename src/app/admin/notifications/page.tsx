"use client";

import { useState, useEffect } from 'react';
import { 
  IoNotificationsOutline,
  IoSendOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoTrashOutline,
  IoEyeOutline,
  IoFilterOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoAddOutline,
  IoCloseOutline,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoCheckmarkOutline
} from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  status: string;
}

export default function AdminNotificationsPage() {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'SYSTEM',
    targetUsers: [] as string[]
  });
  const [sending, setSending] = useState(false);

  const fetchNotifications = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const response = await authApi.get('/api/admin/notifications');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!accessToken) return;
    
    try {
      const response = await authApi.get('/api/admin/users');
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const sendBroadcastNotification = async () => {
    if (!broadcastForm.title || !broadcastForm.message) return;
    
    try {
      setSending(true);
      await authApi.post('/api/admin/notifications/broadcast', {
        title: broadcastForm.title,
        message: broadcastForm.message,
        type: broadcastForm.type,
        targetUsers: broadcastForm.targetUsers.length > 0 ? broadcastForm.targetUsers : undefined
      });
      
      setBroadcastForm({ title: '', message: '', type: 'SYSTEM', targetUsers: [] });
      setShowBroadcastModal(false);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to send broadcast notification:', error);
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await authApi.delete(`/api/admin/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TRANSACTION':
        return <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><IoCheckmarkCircleOutline className="w-4 h-4" /></div>;
      case 'SYSTEM':
        return <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center"><IoInformationCircleOutline className="w-4 h-4" /></div>;
      case 'KYC':
        return <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><IoPersonOutline className="w-4 h-4" /></div>;
      case 'WARNING':
        return <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center"><IoWarningOutline className="w-4 h-4" /></div>;
      default:
        return <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><IoNotificationsOutline className="w-4 h-4" /></div>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read);
    
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.user?.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesType && matchesSearch;
  });

  const notificationTypes = ['all', ...Array.from(new Set(notifications.map(n => n.type)))];
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
      fetchUsers();
    }
  }, [accessToken]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
              <IoNotificationsOutline className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
              <p className="text-gray-600">Manage system notifications and broadcast messages</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <IoRefreshOutline className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <IoSendOutline className="w-4 h-4" />
              Broadcast Notification
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <IoNotificationsOutline className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <IoEyeOutline className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Notifications</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type === 'SYSTEM').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IoInformationCircleOutline className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-purple-600">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <IoPersonOutline className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Filter by status */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          
          {/* Filter by type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {notificationTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications ({filteredNotifications.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <IoNotificationsOutline className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
                  !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            notification.type === 'TRANSACTION' ? 'bg-blue-100 text-blue-800' :
                            notification.type === 'SYSTEM' ? 'bg-gray-100 text-gray-800' :
                            notification.type === 'KYC' ? 'bg-green-100 text-green-800' :
                            notification.type === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {notification.type}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>User: {notification.user?.username || 'System'}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <IoTrashOutline className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Broadcast Notification</h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <IoCloseOutline className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Notification title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Notification message"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={broadcastForm.type}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="SYSTEM">System</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Information</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendBroadcastNotification}
                disabled={sending || !broadcastForm.title || !broadcastForm.message}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <IoSendOutline className="w-4 h-4" />
                    Send
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