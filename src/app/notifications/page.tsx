'use client';

import React, { useState, useEffect } from 'react';
import {
  IoNotificationsOutline,
  IoCheckmarkCircleOutline,
  IoTrashOutline,
  IoWalletOutline,
  IoShieldCheckmarkOutline,
  IoSettingsOutline,
  IoRefreshOutline,
  IoCheckmarkDoneOutline,
  IoChatbubbleOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/AppShell';
import { useToast } from '@/contexts/ToastContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export default function NotificationsPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const fetchNotifications = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [accessToken]);

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      showToast('Notification deleted', 'success');
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TRANSACTION':
        return <IoWalletOutline className="w-5 h-5 text-blue-400" />;
      case 'CHAT':
        return <IoChatbubbleOutline className="w-5 h-5 text-purple-400" />;
      case 'POST':
        return <IoDocumentTextOutline className="w-5 h-5 text-indigo-400" />;
      case 'SYSTEM':
        return <IoSettingsOutline className="w-5 h-5 text-gray-400" />;
      case 'KYC':
        return <IoShieldCheckmarkOutline className="w-5 h-5 text-green-400" />;
      case 'ESCROW':
        return <IoShieldCheckmarkOutline className="w-5 h-5 text-orange-400" />;
      default:
        return <IoNotificationsOutline className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-6 sm:py-8 mb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <IoNotificationsOutline className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{unreadCount}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Notifications</h1>
                  <p className="text-sm sm:text-base text-white/80">{notifications.length} total</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="p-2 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <IoRefreshOutline className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-2 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-all flex items-center gap-2"
                  >
                    <IoCheckmarkDoneOutline className="w-5 h-5" />
                    <span className="hidden sm:inline">Mark All Read</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
              <div className="text-2xl font-bold text-white">{notifications.length}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
              <div className="text-2xl font-bold text-orange-400">{unreadCount}</div>
              <div className="text-sm text-gray-400">Unread</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
              <div className="text-2xl font-bold text-green-400">{notifications.length - unreadCount}</div>
              <div className="text-sm text-gray-400">Read</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 mb-6">
            <div className="flex gap-2">
              {(['all', 'unread', 'read'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <IoNotificationsOutline className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
                <p className="text-gray-400">
                  {filter === 'unread' ? 'All caught up!' : 
                   filter === 'read' ? 'No read notifications yet' :
                   'You don\'t have any notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 hover:bg-slate-700/30 transition-colors ${
                      !notification.isRead ? 'bg-blue-600/5 border-l-2 sm:border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                                {notification.title}
                              </h3>
                              <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded-full bg-slate-700 text-gray-300 w-fit">
                                {notification.type}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-300 mb-1.5 line-clamp-2">{notification.message}</p>
                            <span className="text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</span>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center gap-1 flex-shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <IoCheckmarkCircleOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <IoTrashOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
