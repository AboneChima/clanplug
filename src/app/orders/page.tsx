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
  escrowId?: string; // Added to track associated escrow
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

  const handlePayNow = async (request: PurchaseRequest) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // FIXED: Convert amount to number first
      const amount = Number(request.amount);
      const fee = amount * 0.005;
      const total = amount + fee;

      console.log('Creating escrow with:', {
        sellerId: request.sellerId,
        amount: amount,
        currency: request.currency,
        title: request.post.title,
      });

      // Check balance first - FIXED: Use /api/wallets (plural)
      const walletResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        const wallets = walletData.data || walletData.wallets || [];
        const userWallet = wallets.find((w: any) => w.currency === request.currency);
        
        // FIXED: Convert balance to number
        const balance = userWallet ? Number(userWallet.balance) : 0;
        
        console.log('Wallet check:', { userWallet, balance, total, currency: request.currency });
        
        if (!userWallet || balance < total) {
          showToast(
            `Insufficient balance. You need ${total.toFixed(2)} ${request.currency} (including ${fee.toFixed(2)} ${request.currency} fee). Current balance: ${balance.toFixed(2)} ${request.currency}`,
            'error'
          );
          return;
        }
      } else {
        console.error('Wallet fetch failed:', walletResponse.status);
        showToast('Failed to check wallet balance. Please try again.', 'error');
        return;
      }

      // Confirm payment
      if (!confirm(`Create escrow and pay for "${request.post.title}"?\n\nAmount: ${amount.toFixed(2)} ${request.currency}\nFee (0.5%): ${fee.toFixed(2)} ${request.currency}\nTotal: ${total.toFixed(2)} ${request.currency}\n\nMoney will be held securely until you confirm delivery.`)) {
        return;
      }

      // Create escrow
      const escrowResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/escrow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: request.sellerId,
          amount: amount,
          currency: request.currency,
          title: request.post.title,
          description: `Purchase of ${request.post.title}`,
          terms: 'Marketplace purchase via accepted request',
          autoReleaseHours: 1 // FIXED: Must be integer, minimum 1 hour
        }),
      });

      console.log('Escrow response status:', escrowResponse.status);

      if (escrowResponse.ok) {
        const escrowData = await escrowResponse.json();
        console.log('Escrow created successfully:', escrowData);
        
        // Update purchase request with escrowId
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/purchase-requests/${request.id}/link-escrow`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ escrowId: escrowData.data.id }),
          });
        } catch (error) {
          console.error('Failed to link escrow to purchase request:', error);
        }
        
        showToast('✅ Payment successful! Escrow created.', 'success');
        
        // Redirect to escrow page with the specific escrow ID
        window.location.href = `/escrow?id=${escrowData.data.id}`;
      } else {
        const error = await escrowResponse.json();
        console.error('Escrow creation error:', error);
        // Show validation errors if available
        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((e: any) => e.msg || e.message).join(', ');
          showToast(`Validation failed: ${errorMessages}`, 'error');
        } else {
          showToast(error.message || error.error || 'Failed to create escrow. Check console for details.', 'error');
        }
      }
    } catch (error: any) {
      console.error('Pay now error:', error);
      showToast(error.message || 'Failed to process payment. Check console for details.', 'error');
    }
  };

  const getStatusBadge = (status: string, expiresAt?: string) => {
    const isExpired = expiresAt && new Date() > new Date(expiresAt);
    
    switch (status) {
      case 'PENDING_SELLER_RESPONSE':
        return (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
            isExpired 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            <IoHourglassOutline className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            {isExpired ? 'Expired' : 'Pending'}
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <IoCheckmarkCircleOutline className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <IoCloseCircleOutline className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            Rejected
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <IoTimeOutline className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            Expired
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <IoCloseCircleOutline className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header - Compact */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1">Orders</h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden xs:block">Manage requests</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/escrow'}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium"
              >
                🛡️ <span className="hidden sm:inline">My Escrows</span>
              </button>
              <button
                onClick={loadRequests}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
              >
                <IoRefreshOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Tabs - Compact */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 sm:p-1 mb-3 sm:mb-4">
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sent ({sentRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Received ({receivedRequests.length})
            </button>
          </div>

          {/* Helper Banner for Accepted Requests */}
          {activeTab === 'sent' && sentRequests.some(r => r.status === 'ACCEPTED') && (
            <div className="mb-3 sm:mb-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-500/50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-shrink-0">
                  <IoCheckmarkCircleOutline className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">✅ Request Accepted!</h3>
                  <p className="text-xs sm:text-sm text-gray-300">
                    After payment, track your order progress in <button onClick={() => window.location.href = '/escrow'} className="text-green-400 underline font-medium">My Escrows</button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Requests List */}
          {currentRequests.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 sm:p-8 text-center">
              <IoPersonOutline className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">
                No {activeTab === 'sent' ? 'sent' : 'received'} requests
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                {activeTab === 'sent'
                  ? 'Browse the marketplace to send requests'
                  : 'You haven\'t received any requests yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {currentRequests.map((request) => {
                const otherUser = activeTab === 'sent' ? request.seller : request.buyer;
                const isPending = request.status === 'PENDING_SELLER_RESPONSE';
                const canRespond = activeTab === 'received' && isPending && new Date() < new Date(request.expiresAt);
                const canCancel = activeTab === 'sent' && isPending;

                return (
                  <div key={request.id} className="bg-slate-800 border border-slate-700 rounded-lg sm:rounded-xl p-2 sm:p-3">
                    <div className="flex gap-2 sm:gap-3">
                      {/* Post Image - Smaller */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                        {request.post.images && request.post.images.length > 0 ? (
                          <Image
                            src={request.post.images[0]}
                            alt={request.post.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IoPersonOutline className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Content - Compact */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1 sm:mb-1.5 gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-xs sm:text-sm truncate">
                              {request.post.title}
                            </h3>
                            <p className="text-gray-400 text-[10px] sm:text-xs truncate">
                              {activeTab === 'sent' ? 'To' : 'From'}: {otherUser.firstName} {otherUser.lastName}
                            </p>
                          </div>
                          {getStatusBadge(request.status, request.expiresAt)}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <div className="flex items-center gap-0.5 sm:gap-1 text-green-400">
                            <IoPricetagOutline className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="text-[10px] sm:text-xs font-medium">
                              {request.amount} {request.currency}
                            </span>
                          </div>
                          
                          {isPending && (
                            <div className="flex items-center gap-0.5 sm:gap-1 text-yellow-400">
                              <IoTimeOutline className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="text-[10px] sm:text-xs">
                                {formatTimeRemaining(request.expiresAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions - Compact */}
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          <button
                            onClick={() => window.open(`/marketplace/${request.postId}`, '_blank')}
                            className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] sm:text-xs rounded-md transition-colors"
                          >
                            <IoEyeOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden xs:inline">View</span>
                          </button>

                          {canRespond && (
                            <>
                              <button
                                onClick={() => handleAcceptRequest(request.id)}
                                className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] sm:text-xs rounded-md transition-colors"
                              >
                                <IoCheckmarkCircleOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] sm:text-xs rounded-md transition-colors"
                              >
                                <IoCloseCircleOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Reject
                              </button>
                            </>
                          )}

                          {canCancel && (
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-[10px] sm:text-xs rounded-md transition-colors"
                            >
                              <IoCloseCircleOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              Cancel
                            </button>
                          )}

                          {request.status === 'ACCEPTED' && activeTab === 'sent' && !request.escrowId && (
                            <button
                              onClick={() => handlePayNow(request)}
                              className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs rounded-md transition-colors"
                            >
                              Pay Now
                            </button>
                          )}

                          {/* Show escrow link for accepted requests (buyer can check progress) */}
                          {request.status === 'ACCEPTED' && activeTab === 'sent' && (
                            <button
                              onClick={() => window.location.href = '/escrow'}
                              className="flex items-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] sm:text-xs rounded-md transition-colors"
                            >
                              🛡️ My Escrows
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
