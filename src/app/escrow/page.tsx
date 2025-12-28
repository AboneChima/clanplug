'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Image from 'next/image';
import {
  IoCheckmarkCircle,
  IoTimeOutline,
  IoAlertCircle,
  IoShieldCheckmark,
  IoArrowBack,
  IoRefreshOutline,
  IoChatbubbleOutline,
  IoCloseCircle,
} from 'react-icons/io5';

interface Escrow {
  id: string;
  title: string;
  description: string;
  amount: number;
  fee: number;
  currency: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  fundedAt?: string;
  releasedAt?: string;
  autoReleaseAt?: string;
  buyer: {
    id: string;
    username: string;
    avatar?: string;
  };
  seller: {
    id: string;
    username: string;
    avatar?: string;
  };
  post?: {
    id: string;
    title: string;
    images: string[];
  };
}

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [orders, setOrders] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Escrow | null>(null);

  useEffect(() => {
    loadOrders();
    
    // Check if there's a specific order ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    if (orderId) {
      loadSpecificOrder(orderId);
    }

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/escrow`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/escrow/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.data);
      }
    } catch (error) {
      console.error('Failed to load order:', error);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    if (!confirm('Confirm that you received the item and release payment to seller?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/escrow/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('✅ Payment released to seller!', 'success');
        loadOrders();
        setSelectedOrder(null);
      } else {
        showToast('Failed to confirm delivery', 'error');
      }
    } catch (error) {
      showToast('Failed to confirm delivery', 'error');
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    const credentials = prompt('Enter login credentials for the buyer:\n\nExample:\nUsername: account123\nPassword: pass456\nEmail: email@example.com');
    
    if (!credentials) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/escrow/${orderId}/deliver`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deliveryNotes: credentials })
      });

      if (response.ok) {
        showToast('✅ Credentials sent to buyer!', 'success');
        loadOrders();
      } else {
        showToast('Failed to send credentials', 'error');
      }
    } catch (error) {
      showToast('Failed to send credentials', 'error');
    }
  };

  const getStepStatus = (order: Escrow, step: number) => {
    if (order.status === 'RELEASED') return 'complete';
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return 'cancelled';
    
    if (step === 1) return 'complete'; // Payment always complete if order exists
    if (step === 2) return order.adminNotes ? 'complete' : order.status === 'FUNDED' ? 'active' : 'pending';
    if (step === 3) return order.status === 'RELEASED' ? 'complete' : order.adminNotes ? 'active' : 'pending';
    
    return 'pending';
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    );
  }

  // Show specific order details
  if (selectedOrder) {
    const isBuyer = selectedOrder.buyer.id === user?.id;
    const step1 = getStepStatus(selectedOrder, 1);
    const step2 = getStepStatus(selectedOrder, 2);
    const step3 = getStepStatus(selectedOrder, 3);

    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                <IoArrowBack className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Order Details</h1>
                <p className="text-gray-400 text-sm">Track your order progress</p>
              </div>
            </div>

            {/* Order Info Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
              <div className="flex gap-4 mb-4">
                {selectedOrder.post?.images?.[0] && (
                  <Image
                    src={selectedOrder.post.images[0]}
                    alt={selectedOrder.title}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">{selectedOrder.title}</h2>
                  <p className="text-gray-400 text-sm mb-2">{selectedOrder.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-400 font-semibold">
                      {selectedOrder.amount} {selectedOrder.currency}
                    </span>
                    <span className="text-gray-400">
                      {isBuyer ? 'Seller:' : 'Buyer:'} {isBuyer ? selectedOrder.seller.username : selectedOrder.buyer.username}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-6">Order Progress</h3>
              
              <div className="space-y-6">
                {/* Step 1: Payment */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step1 === 'complete' ? 'bg-green-500' : 'bg-gray-600'
                    }`}>
                      <IoCheckmarkCircle className="w-6 h-6 text-white" />
                    </div>
                    {step2 !== 'pending' && <div className="w-0.5 h-12 bg-green-500 mt-2"></div>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Payment Completed</h4>
                    <p className="text-sm text-gray-400">Money held securely in escrow</p>
                  </div>
                </div>

                {/* Step 2: Delivery */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step2 === 'complete' ? 'bg-green-500' : step2 === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'
                    }`}>
                      {step2 === 'complete' ? <IoCheckmarkCircle className="w-6 h-6 text-white" /> : <IoTimeOutline className="w-6 h-6 text-white" />}
                    </div>
                    {step3 !== 'pending' && <div className="w-0.5 h-12 bg-green-500 mt-2"></div>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">
                      {step2 === 'complete' ? 'Credentials Provided' : 'Waiting for Delivery'}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {isBuyer ? 'Seller will provide login credentials' : 'Provide login credentials to buyer'}
                    </p>
                    
                    {/* Show credentials to buyer */}
                    {isBuyer && selectedOrder.adminNotes && (
                      <div className="mt-3 bg-slate-900 border border-green-500/30 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-green-400 mb-2">🎉 Login Credentials:</h5>
                        <pre className="text-xs text-white whitespace-pre-wrap font-mono">{selectedOrder.adminNotes}</pre>
                      </div>
                    )}
                    
                    {/* Show credentials to seller too (so they know what they sent) */}
                    {!isBuyer && selectedOrder.adminNotes && (
                      <div className="mt-3 bg-slate-900 border border-blue-500/30 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-blue-400 mb-2">📝 Credentials You Sent:</h5>
                        <pre className="text-xs text-white whitespace-pre-wrap font-mono">{selectedOrder.adminNotes}</pre>
                        <p className="text-xs text-gray-400 mt-2">Click "Update Credentials" below if you need to fix any mistakes</p>
                      </div>
                    )}
                    
                    {/* Seller action - can always update credentials */}
                    {!isBuyer && selectedOrder.status === 'FUNDED' && (
                      <button
                        onClick={() => handleMarkDelivered(selectedOrder.id)}
                        className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        {selectedOrder.adminNotes ? 'Update Credentials' : 'Provide Credentials'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3: Confirmation */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step3 === 'complete' ? 'bg-green-500' : step3 === 'active' ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'
                    }`}>
                      {step3 === 'complete' ? <IoCheckmarkCircle className="w-6 h-6 text-white" /> : <IoShieldCheckmark className="w-6 h-6 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">
                      {step3 === 'complete' ? 'Order Complete!' : 'Awaiting Confirmation'}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {step3 === 'complete' ? 'Payment released to seller' : 'Buyer will confirm after testing credentials'}
                    </p>
                    
                    {/* Buyer action */}
                    {isBuyer && selectedOrder.adminNotes && selectedOrder.status === 'FUNDED' && (
                      <button
                        onClick={() => handleConfirmDelivery(selectedOrder.id)}
                        className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        ✅ Confirm & Release Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Banner */}
            {selectedOrder.status === 'RELEASED' && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
                <IoCheckmarkCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white">Order Complete!</h3>
                <p className="text-sm text-gray-300">Transaction successful</p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  // Show orders list
  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">My Orders</h1>
              <p className="text-gray-400 text-sm">Track your purchases</p>
            </div>
            <button
              onClick={loadOrders}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <IoRefreshOutline className="w-5 h-5" />
            </button>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
              <IoShieldCheckmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No orders yet</h3>
              <p className="text-gray-400 mb-4">Your purchases will appear here</p>
              <button
                onClick={() => router.push('/posts')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isBuyer = order.buyer.id === user?.id;
                const hasCredentials = !!order.adminNotes;
                const isComplete = order.status === 'RELEASED';

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
                  >
                    <div className="flex gap-4">
                      {order.post?.images?.[0] && (
                        <Image
                          src={order.post.images[0]}
                          alt={order.title}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white">{order.title}</h3>
                          {isComplete ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Complete</span>
                          ) : hasCredentials && isBuyer ? (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full animate-pulse">Ready to Confirm</span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">In Progress</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          {isBuyer ? 'Seller:' : 'Buyer:'} {isBuyer ? order.seller.username : order.buyer.username}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-green-400 font-semibold">{order.amount} {order.currency}</span>
                          <span className="text-xs text-gray-500">Click to view details</span>
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
