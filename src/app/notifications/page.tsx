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
import PostModal from '@/components/PostModal';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import VTUTransactionModal from '@/components/VTUTransactionModal';

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
  const { user, accessToken, refetchUser } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Notification | null>(null);
  const [selectedVTUTransaction, setSelectedVTUTransaction] = useState<Notification | null>(null);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        
        // Refresh from server to ensure persistence
        setTimeout(() => {
          fetchNotifications();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        showToast('All notifications marked as read', 'success');
        
        // Refresh from server to ensure persistence
        setTimeout(() => {
          fetchNotifications();
        }, 500);
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to mark all as read', 'error');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      showToast('Failed to mark all as read', 'error');
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

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    const data = notification.data || {};
    
    // Route based on notification type
    switch (notification.type) {
      case 'TRANSACTION':
        // Check if it's a VTU transaction
        if (data.type === 'airtime' || data.type === 'data') {
          setSelectedVTUTransaction(notification);
        } else {
          // Regular transaction (withdrawal, deposit, etc.)
          setSelectedTransaction(notification);
        }
        break;
        
      case 'CHAT':
      case 'MESSAGE':
        // Navigate to specific chat conversation
        if (data.chatId) {
          // Navigate to chat with specific conversation ID
          window.location.href = `/chat?id=${data.chatId}`;
        } else if (data.fromUserId) {
          // If only userId, open chat with that user
          window.location.href = `/chat?id=${data.fromUserId}`;
        }
        break;
        
      case 'LIKE':
      case 'COMMENT':
      case 'FAVORITE':
      case 'POST':
        // Open post directly in modal overlay
        if (data.postId) {
          setSelectedPostId(data.postId);
        }
        break;
        
      case 'FOLLOW':
        // Navigate to user profile using router
        if (data.fromUserId) {
          window.location.href = `/user/${data.fromUserId}`;
        }
        break;
        
      case 'KYC':
        // Refetch user data to get updated KYC status
        await refetchUser();
        
        // Navigate to KYC page or profile if approved
        if (notification.title.includes('Approved')) {
          showToast('✅ KYC Approved! You can now post on marketplace.', 'success');
          window.location.href = '/profile';
        } else if (notification.title.includes('Rejected') || notification.title.includes('Revoked')) {
          showToast('KYC status updated. Please check your profile.', 'info');
          window.location.href = '/kyc';
        } else {
          window.location.href = '/kyc';
        }
        break;
        
      case 'ESCROW':
        // Navigate to escrow page
        if (data.escrowId) {
          window.location.href = `/escrow?id=${data.escrowId}`;
        }
        break;
        
      default:
        // For other types, just mark as read
        break;
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
    <>
      {selectedPostId && (
        <PostModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}
      {selectedTransaction && (
        <TransactionDetailsModal 
          isOpen={true}
          onClose={() => setSelectedTransaction(null)}
          notification={selectedTransaction}
        />
      )}
      {selectedVTUTransaction && (
        <VTUTransactionModal 
          notification={selectedVTUTransaction}
          onClose={() => setSelectedVTUTransaction(null)}
        />
      )}
      <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8">
        {/* Header - Clean Modern Design */}
        <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm py-4 mb-3">
          <div className="max-w-6xl mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center">
                    <IoNotificationsOutline className="w-5 h-5 text-white" />
                  </div>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                      <span className="text-[10px] font-bold text-white">{unreadCount}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-base sm:text-xl font-bold text-white">Notifications</h1>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-md transition-all"
                >
                  <IoRefreshOutline className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-md transition-all"
                  >
                    <IoCheckmarkDoneOutline className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Stats - Inline */}
            <div className="flex gap-3 text-white/90 text-xs">
              <span><span className="font-bold">{notifications.length}</span> Total</span>
              <span>•</span>
              <span><span className="font-bold text-orange-300">{unreadCount}</span> Unread</span>
              <span>•</span>
              <span><span className="font-bold text-green-300">{notifications.length - unreadCount}</span> Read</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Filters - Compact */}
          <div className="flex gap-1.5 mb-3">
            {(['all', 'unread', 'read'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>

          {/* Notifications List - Compact */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">Loading...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <IoNotificationsOutline className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <h3 className="text-sm font-medium text-white mb-1">No notifications</h3>
                <p className="text-gray-400 text-xs">
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
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-2.5 hover:bg-slate-700/30 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-600/5 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h3 className="text-xs font-semibold text-white truncate">
                                {notification.title}
                              </h3>
                              <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-slate-700 text-gray-300 flex-shrink-0">
                                {notification.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 mb-1 line-clamp-2">{notification.message}</p>
                            {notification.data?.actionButton && (
                              <a
                                href={notification.data.actionButton.link}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-block mt-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all"
                              >
                                {notification.data.actionButton.text}
                              </a>
                            )}
                            <span className="text-[10px] text-gray-500 block mt-1">{formatTimeAgo(notification.createdAt)}</span>
                          </div>
                          
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-green-400 hover:bg-slate-700 rounded transition-colors"
                                title="Mark as read"
                              >
                                <IoCheckmarkCircleOutline className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                              title="Delete"
                            >
                              <IoTrashOutline className="w-4 h-4" />
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
    </>
  );
}
