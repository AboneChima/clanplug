'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import AppShell from '@/components/AppShell';
import Image from 'next/image';
import {
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoHourglassOutline,
  IoPersonOutline,
  IoPricetagOutline,
  IoRefreshOutline,
  IoEyeOutline,
} from 'react-icons/io5';

interface PurchaseRequest {
  id: string;
  buyerId: string;
  sellerId: string;
  postId: string;
  amount: number;
  currency: string;
  status: 'PENDING_SELLER_RESPONSE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  buyer: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  seller: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  post: {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
    status: string;
  };
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchase-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      } else {
        showToast('Failed to load orders', 'error');
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRequests();
      // Refresh every 10 seconds for real-time updates
      const interval = setInterval(loadRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchase-requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showToast('✅ Request accepted! Buyer will proceed to payment.', 'success');
        loadRequests();
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to accept request', 'error');
      }
    } catch (error) {
      showToast('Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchase-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        showToast('Request rejected', 'success');
        loadRequests();
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to reject request', 'error');
      }
    } catch (error) {
      showToast('Failed to reject request', 'error');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchase-requests/${requestId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showToast('Request cancelled', 'success');
        loadRequests();
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to cancel request', 'error');
      }
    } catch (error) {
      showToast('Failed to cancel request', 'error');
    }
  };

  const getStatusBadge = (status: string, expiresAt?: string) => {
    const isExpired = expiresAt && new Date() > new Date(expiresAt);
    
    switch (status) {
      case 'PENDING_SELLER_RESPONSE':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isExpired 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            <IoHourglassOutline className="w-3 h-3" />
            {isExpired ? 'Expired' : 'Pending'}
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <IoCheckmarkCircleOutline className="w-3 h-3" />
            Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <IoCloseCircleOutline className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <IoTimeOutline className="w-3 h-3" />
            Expired
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <IoCloseCircleOutline className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const sentRequests = requests.filter(r => r.buyerId === user?.id);
  const receivedRequests = requests.filter(r => r.sellerId === user?.id);
  const currentRequests = activeTab === 'sent' ? sentRequests : receivedRequests;

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Orders</h1>
              <p className="text-gray-400">Manage your purchase requests</p>
            </div>
            <button
              onClick={loadRequests}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <IoRefreshOutline className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sent ({sentRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Received ({receivedRequests.length})
            </button>
          </div>

          {/* Requests List */}
          {currentRequests.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
              <IoPersonOutline className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No {activeTab === 'sent' ? 'sent' : 'received'} requests
              </h3>
              <p className="text-gray-400">
                {activeTab === 'sent'
                  ? 'Browse the marketplace to send purchase requests'
                  : 'You haven\'t received any purchase requests yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentRequests.map((request) => {
                const otherUser = activeTab === 'sent' ? request.seller : request.buyer;
                const isPending = request.status === 'PENDING_SELLER_RESPONSE';
                const canRespond = activeTab === 'received' && isPending && new Date() < new Date(request.expiresAt);
                const canCancel = activeTab === 'sent' && isPending;

                return (
                  <div key={request.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div className="flex gap-4">
                      {/* Post Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                        {request.post.images && request.post.images.length > 0 ? (
                          <Image
                            src={request.post.images[0]}
                            alt={request.post.title}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IoPersonOutline className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-white text-sm truncate">
                              {request.post.title}
                            </h3>
                            <p className="text-gray-400 text-xs">
                              {activeTab === 'sent' ? 'To' : 'From'}: {otherUser.firstName} {otherUser.lastName} (@{otherUser.username})
                            </p>
                          </div>
                          {getStatusBadge(request.status, request.expiresAt)}
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1 text-green-400">
                            <IoPricetagOutline className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {request.amount} {request.currency}
                            </span>
                          </div>
                          
                          {isPending && (
                            <div className="flex items-center gap-1 text-yellow-400">
                              <IoTimeOutline className="w-4 h-4" />
                              <span className="text-xs">
                                {formatTimeRemaining(request.expiresAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`/marketplace/${request.postId}`, '_blank')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors"
                          >
                            <IoEyeOutline className="w-3 h-3" />
                            View
                          </button>

                          {canRespond && (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(request.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                              >
                                <IoCheckmarkCircleOutline className="w-3 h-3" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                              >
                                <IoCloseCircleOutline className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}

                          {canCancel && (
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
                            >
                              <IoCloseCircleOutline className="w-3 h-3" />
                              Cancel
                            </button>
                          )}

                          {request.status === 'ACCEPTED' && activeTab === 'sent' && (
                            <button
                              onClick={() => window.location.href = '/escrow'}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                            >
                              Proceed to Payment
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
