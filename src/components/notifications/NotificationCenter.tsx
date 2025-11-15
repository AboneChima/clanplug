'use client';

import React, { useState, useEffect } from 'react';
import {
  IoNotificationsOutline,
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoTrashOutline,
  IoWalletOutline,
  IoCardOutline,
  IoShieldCheckmarkOutline,
  IoLockClosedOutline,
  IoSettingsOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
} from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth-api';
import { useVisibilityRefresh } from '@/hooks/usePageVisibility';

interface Notification {
  id: string;
  type: 'payment' | 'transaction' | 'kyc' | 'system' | 'escrow';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const fetchNotifications = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      // Fetch notifications
      const response = await authApi.get('/api/notifications?limit=10');
      if (response.success) {
        setNotifications(response.data || []);
      }
      
      // Fetch unread count separately
      const unreadResponse = await authApi.get('/api/notifications/unread-count');
      if (unreadResponse.success) {
        setUnreadCount(unreadResponse.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time notification connection
  const setupRealTimeConnection = () => {
    if (!accessToken || eventSource) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/stream?token=${accessToken}`;
    
    console.log('Setting up notification stream connection...', {
      hasToken: !!accessToken,
      tokenLength: accessToken ? accessToken.length : 0,
      apiUrl: process.env.NEXT_PUBLIC_API_URL
    });
    
    // Create EventSource with better error handling
    const es = new EventSource(url);

    es.onopen = () => {
      console.log('✅ Connected to notification stream successfully');
    };

    es.addEventListener('connected', (event) => {
      console.log('✅ Notification stream connected successfully:', JSON.parse(event.data));
    });

    es.addEventListener('new_notification', (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only 10 notifications
      setUnreadCount(prev => prev + 1);
      
      // Show a toast notification for new notifications
      console.log('📬 New notification received:', notification);
    });

    es.addEventListener('unread_count', (event) => {
      const { count } = JSON.parse(event.data);
      setUnreadCount(count);
      console.log('📊 Unread count updated:', count);
    });

    es.addEventListener('heartbeat', (event) => {
      // Keep connection alive - only log occasionally to avoid spam
      if (Math.random() < 0.1) { // Log 10% of heartbeats
        console.log('💓 Heartbeat received');
      }
    });

    es.onerror = (event) => {
      const errorInfo = {
        readyState: es.readyState,
        url: es.url,
        timestamp: new Date().toISOString(),
        readyStateText: es.readyState === EventSource.CONNECTING ? 'CONNECTING' : 
                       es.readyState === EventSource.OPEN ? 'OPEN' : 'CLOSED',
        eventType: event.type || 'error',
        hasToken: !!accessToken,
        tokenLength: accessToken ? accessToken.length : 0
      };

      // Provide detailed error information
      console.error('Notification stream connection failed:', errorInfo);

      // Handle connection failures more gracefully
      if (es.readyState === EventSource.CLOSED) {
        console.log('EventSource connection closed, will retry in 10 seconds...');
        es.close();
        setEventSource(null);
        // Retry connection after 10 seconds (increased from 5)
        setTimeout(setupRealTimeConnection, 10000);
      } else if (es.readyState === EventSource.CONNECTING) {
        console.log('EventSource is still connecting, waiting...');
        // If it's been connecting for too long, close and retry
        setTimeout(() => {
          if (es.readyState === EventSource.CONNECTING) {
            console.log('EventSource connection timeout, retrying...');
            es.close();
            setEventSource(null);
            setTimeout(setupRealTimeConnection, 5000);
          }
        }, 15000);
      }
    };

    setEventSource(es);
  };

  // Cleanup real-time connection
  const cleanupRealTimeConnection = () => {
    if (eventSource) {
      console.log('🔌 Disconnecting from notification stream...');
      eventSource.close();
      setEventSource(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!accessToken) return;
    
    try {
      await authApi.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!accessToken) return;
    
    try {
      await authApi.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!accessToken) return;
    
    try {
      await authApi.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string, data?: any) => {
    switch (type) {
      case 'payment':
        return <IoWalletOutline className="w-5 h-5 text-green-500" />;
      case 'transaction':
        // Enhanced transaction icons based on direction or type
        if (data?.direction === 'debit' || data?.type === 'debit') {
          return (
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <IoArrowUpOutline className="w-4 h-4 text-red-600" />
            </div>
          );
        } else if (data?.direction === 'credit' || data?.type === 'credit') {
          return (
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <IoArrowDownOutline className="w-4 h-4 text-green-600" />
            </div>
          );
        }
        return <IoCardOutline className="w-5 h-5 text-blue-500" />;
      case 'kyc':
        return <IoShieldCheckmarkOutline className="w-5 h-5 text-purple-500" />;
      case 'escrow':
        return <IoLockClosedOutline className="w-5 h-5 text-orange-500" />;
      case 'security':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <IoShieldCheckmarkOutline className="w-4 h-4 text-yellow-600" />
          </div>
        );
      case 'system':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <IoSettingsOutline className="w-4 h-4 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <IoNotificationsOutline className="w-4 h-4 text-gray-600" />
          </div>
        );
    }
  };

  const getTransferAmountDisplay = (message: string, data?: any) => {
    // Check if this is a transfer notification with amount data
    if (data?.direction && (data.direction === 'debit' || data.direction === 'credit')) {
      const isDebit = data.direction === 'debit';
      const parts = message.split(' ');
      
      // Find the amount part (should start with + or -)
      const amountIndex = parts.findIndex(part => part.startsWith('+') || part.startsWith('-'));
      
      if (amountIndex !== -1 && amountIndex + 1 < parts.length) {
        const symbol = parts[amountIndex].charAt(0);
        const currency = parts[amountIndex + 1];
        const amount = parts[amountIndex].substring(1);
        const restOfMessage = parts.slice(amountIndex + 2).join(' ');
        const beforeAmount = parts.slice(0, amountIndex).join(' ');
        
        return (
          <span>
            {beforeAmount}{beforeAmount ? ' ' : ''}
            <span className={`font-semibold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
              {symbol} {currency} {amount}
            </span>
            {restOfMessage ? ` ${restOfMessage}` : ''}
          </span>
        );
      }
    }
    
    return message;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getBriefNotificationDisplay = (notification: Notification) => {
    const { message, data, type } = notification;
    
    if (type === 'transaction' && data) {
      const isCredit = data.direction === 'credit';
      const isDebit = data.direction === 'debit';
      
      if (isCredit || isDebit) {
        const amount = Math.abs(data.amount || 0);
        const currency = data.currency || 'NGN';
        
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
              {isCredit ? '+' : '-'} {currency} {amount.toLocaleString()}
            </span>
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
              isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isCredit ? 'Received' : 'Sent'}
            </span>
          </div>
        );
      }
    }
    
    // For non-transaction notifications, show a brief version of the message
    const briefMessage = message.length > 60 ? `${message.substring(0, 60)}...` : message;
    return <p className="text-sm text-gray-600">{briefMessage}</p>;
  };

  // Use visibility refresh hook to handle tab switching
  const { isVisible } = useVisibilityRefresh(fetchNotifications, [accessToken], {
    refreshOnVisible: true,
    refreshDelay: 1000,
    enabled: !!accessToken
  });

  // Handle case when there's no access token and setup real-time connection
  useEffect(() => {
    if (accessToken) {
      setupRealTimeConnection();
    } else {
      setLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      cleanupRealTimeConnection();
    }
    
    return () => {
      cleanupRealTimeConnection();
    };
  }, [accessToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRealTimeConnection();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
      >
        <IoNotificationsOutline className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[28rem] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  >
                    <IoCloseOutline className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <IoNotificationsOutline className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">You'll see new notifications here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 transition-all duration-200 cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id);
                        setIsOpen(false);
                        window.location.href = '/notifications';
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type, notification.data)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <div className="mt-1">
                                {getBriefNotificationDisplay(notification)}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <p className="text-xs text-gray-400">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                                {!notification.read && (
                                  <>
                                    <span className="text-xs text-gray-300">•</span>
                                    <span className="text-xs text-blue-600 font-medium">New</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors"
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
                                className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                title="Delete notification"
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

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page
                    window.location.href = '/notifications';
                  }}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium text-center"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}