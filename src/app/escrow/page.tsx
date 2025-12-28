'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus,
  Eye,
  MessageSquare,
  DollarSign,
  User,
  Package,
  Send,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import EscrowService, { 
  EscrowResponse, 
  CreateEscrowRequest 
} from '@/services/escrow.service';

const EscrowPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const [escrows, setEscrows] = useState<EscrowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  
  // Create escrow form
  const [newEscrow, setNewEscrow] = useState<CreateEscrowRequest>({
    sellerId: '',
    amount: 0,
    currency: 'NGN',
    title: '',
    description: '',
    terms: '',
    autoReleaseHours: 1 // 1 hour (minimum allowed)
  });

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Delivery state
  const [deliveryNotes, setDeliveryNotes] = useState('');

  useEffect(() => {
    if (accessToken) {
      loadEscrows();
      
      // Check if there's an escrow ID in URL
      const urlParams = new URLSearchParams(window.location.search);
      const escrowId = urlParams.get('id');
      if (escrowId) {
        // Load and show this specific escrow
        loadSpecificEscrow(escrowId);
      }

      // Auto-refresh every 30 seconds to check for updates
      const interval = setInterval(() => {
        loadEscrows();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [accessToken]);

  const loadSpecificEscrow = async (escrowId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/escrow/${escrowId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const escrow = data.data;
        setSelectedEscrow(escrow);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Failed to load specific escrow:', error);
    }
  };

  const loadEscrows = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await EscrowService.getUserEscrows(accessToken);
      setEscrows(data.escrows || []);
      
      // Check if buyer has any escrows with delivery details
      const hasNewDeliveries = data.escrows?.some((e: EscrowResponse) => 
        e.buyerId === user?.id && 
        e.status === 'FUNDED' && 
        e.adminNotes
      );
      
      if (hasNewDeliveries) {
        console.log('🎉 Buyer has new delivery details available!');
      }
    } catch (error) {
      console.error('Failed to load escrows:', error);
      showToast('Failed to load escrows', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEscrow = async () => {
    if (!accessToken) return;
    
    // Validate inputs
    if (!newEscrow.sellerId.trim()) {
      showToast('Please enter seller username', 'error');
      return;
    }
    if (!newEscrow.title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }
    if (newEscrow.amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    try {
      // First, look up the seller by username
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/username/${newEscrow.sellerId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        showToast('Seller not found. Please check the username.', 'error');
        return;
      }

      const userData = await response.json();
      
      if (!userData.success || !userData.data) {
        showToast('Seller not found. Please check the username.', 'error');
        return;
      }

      const seller = userData.data;

      // Check if trying to create escrow with yourself
      if (seller.id === user?.id) {
        showToast('You cannot create an escrow with yourself', 'error');
        return;
      }

      // Calculate total with fee
      const fee = newEscrow.amount * 0.005;
      const total = newEscrow.amount + fee;

      // CHECK BALANCE FIRST before showing confirmation
      const walletResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        const wallets = walletData.data || [];
        const userWallet = wallets.find((w: any) => w.currency === newEscrow.currency);
        
        if (!userWallet || userWallet.balance < total) {
          showToast(
            `Insufficient balance. You need ${total.toFixed(2)} ${newEscrow.currency} (including ${fee.toFixed(2)} ${newEscrow.currency} fee). Current balance: ${userWallet?.balance || 0} ${newEscrow.currency}`,
            'error'
          );
          return;
        }
      }

      // NOW show confirmation (balance is sufficient)
      if (!confirm(`Create escrow for ${newEscrow.amount} ${newEscrow.currency}?\n\nAmount: ${newEscrow.amount} ${newEscrow.currency}\nFee (0.5%): ${fee.toFixed(2)} ${newEscrow.currency}\nTotal: ${total.toFixed(2)} ${newEscrow.currency}\n\nMoney will be deducted from your wallet and held securely.`)) {
        return;
      }

      // Create escrow with seller's ID
      await EscrowService.createEscrow(accessToken, {
        ...newEscrow,
        sellerId: seller.id // Use the actual user ID
      });

      showToast('Escrow created and funded successfully!', 'success');
      setShowCreateModal(false);
      setNewEscrow({
        sellerId: '',
        amount: 0,
        currency: 'NGN',
        title: '',
        description: '',
        terms: '',
        autoReleaseHours: 1
      });
      loadEscrows();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create escrow';
      showToast(errorMessage, 'error');
    }
  };

  const handleConfirmDelivery = async (escrowId: string) => {
    if (!confirm('Confirm that you received the item/service and release payment to seller?')) return;
    try {
      await EscrowService.confirmDelivery(accessToken!, escrowId);
      showToast('Payment released to seller!', 'success');
      loadEscrows();
    } catch (error) {
      showToast('Failed to confirm delivery', 'error');
    }
  };

  const handleMarkDelivered = async (escrowId: string) => {
    // Open delivery modal instead of simple confirm
    setSelectedEscrow(escrows.find(e => e.id === escrowId) || null);
    setShowDeliveryModal(true);
  };

  const submitDelivery = async () => {
    if (!selectedEscrow) return;
    
    if (!deliveryNotes.trim()) {
      showToast('Please provide login credentials or delivery details', 'error');
      return;
    }

    try {
      await EscrowService.markAsDelivered(accessToken!, selectedEscrow.id, deliveryNotes);
      showToast('✅ Delivery details sent to buyer!', 'success');
      setShowDeliveryModal(false);
      setDeliveryNotes('');
      loadEscrows();
    } catch (error) {
      showToast('Failed to mark as delivered', 'error');
    }
  };

  const handleCreateDispute = async (escrowId: string) => {
    const reason = prompt('Please explain the issue:');
    if (!reason) return;
    try {
      await EscrowService.createDispute(accessToken!, escrowId, reason);
      showToast('Dispute created. Admin will review.', 'success');
      loadEscrows();
    } catch (error) {
      showToast('Failed to create dispute', 'error');
    }
  };

  const openChat = async (escrow: EscrowResponse) => {
    setSelectedEscrow(escrow);
    setShowChatModal(true);
    // Load messages
    try {
      const messages = await EscrowService.getEscrowMessages(accessToken!, escrow.id);
      setChatMessages(messages);
    } catch (error) {
      console.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || !selectedEscrow) return;
    try {
      await EscrowService.sendEscrowMessage(accessToken!, selectedEscrow.id, chatMessage);
      setChatMessage('');
      const messages = await EscrowService.getEscrowMessages(accessToken!, selectedEscrow.id);
      setChatMessages(messages);
    } catch (error) {
      showToast('Failed to send message', 'error');
    }
  };

  const handleCancelEscrow = async (escrowId: string) => {
    if (!confirm('Are you sure you want to cancel this escrow? Your money will be refunded immediately.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/escrow/${escrowId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showToast('✅ Escrow cancelled! Money refunded to your wallet.', 'success');
        loadEscrows(); // Reload the list
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to cancel escrow', 'error');
      }
    } catch (error) {
      console.error('Cancel escrow error:', error);
      showToast('Failed to cancel escrow', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      FUNDED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      DISPUTED: 'bg-red-500/20 text-red-300 border-red-500/30',
      RELEASED: 'bg-green-500/20 text-green-300 border-green-500/30',
      CANCELLED: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      REFUNDED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency === 'NGN' ? 'NGN' : 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              Secure Escrow
            </h1>
            <p className="text-gray-400 text-sm mt-1">Protected transactions for digital goods</p>
          </div>
          <button
            onClick={() => loadEscrows()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Delivery Alert Banner */}
        {escrows.some(e => e.buyerId === user?.id && e.status === 'FUNDED' && e.adminNotes) && (
          <div className="mb-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-500/50 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">🎉 Delivery Details Available!</h3>
                <p className="text-sm text-gray-300">
                  Your seller has provided login credentials. Scroll down to view and test them.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">{escrows.length}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-400">{escrows.filter(e => e.status === 'FUNDED').length}</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-400">{escrows.filter(e => e.status === 'RELEASED').length}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-400">{escrows.filter(e => e.status === 'DISPUTED').length}</p>
            <p className="text-xs text-gray-400">Disputed</p>
          </div>
        </div>

        {/* Escrow List */}
        <div className="space-y-4">
          {escrows.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
              <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No escrows yet</h3>
              <p className="text-gray-400 mb-4">Escrows are created automatically when you purchase from marketplace</p>
              <button
                onClick={() => window.location.href = '/posts'}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            escrows.map((escrow) => (
              <div key={escrow.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6 relative">
                {/* New delivery badge for buyer */}
                {escrow.status === 'FUNDED' && escrow.buyerId === user?.id && escrow.adminNotes && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    🎉 Delivered!
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{escrow.title}</h3>
                      {getStatusBadge(escrow.status)}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{escrow.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-green-400 font-medium">{formatCurrency(escrow.amount, escrow.currency)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400">
                          {escrow.buyerId === user?.id ? 'Seller:' : 'Buyer:'}
                        </span>
                        <span className="text-blue-400">
                          {escrow.buyerId === user?.id ? escrow.seller.username : escrow.buyer.username}
                        </span>
                      </div>
                      {escrow.autoReleaseAt && escrow.status === 'FUNDED' && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-400" />
                          <span className="text-orange-400 text-xs">
                            Auto-release: {formatDate(escrow.autoReleaseAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                  {/* Seller actions */}
                  {escrow.sellerId === user?.id && escrow.status === 'FUNDED' && (
                    <button
                      onClick={() => handleMarkDelivered(escrow.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Mark as Delivered
                    </button>
                  )}

                  {/* Buyer actions */}
                  {escrow.buyerId === user?.id && escrow.status === 'FUNDED' && (
                    <>
                      {escrow.adminNotes && (
                        <button
                          onClick={() => { setSelectedEscrow(escrow); setShowDetailsModal(true); }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2 animate-pulse"
                        >
                          <Eye className="w-4 h-4" />
                          View Credentials
                        </button>
                      )}
                      <button
                        onClick={() => handleConfirmDelivery(escrow.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Confirm & Release Payment
                      </button>
                      <button
                        onClick={() => handleCreateDispute(escrow.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Dispute
                      </button>
                      <button
                        onClick={() => handleCancelEscrow(escrow.id)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Cancel & Refund
                      </button>
                    </>
                  )}

                  {/* Cancel button for PENDING status */}
                  {escrow.buyerId === user?.id && escrow.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelEscrow(escrow.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Cancel Escrow
                    </button>
                  )}

                  {/* Chat button */}
                  {escrow.status === 'FUNDED' && (
                    <button
                      onClick={() => openChat(escrow)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </button>
                  )}

                  <button
                    onClick={() => { setSelectedEscrow(escrow); setShowDetailsModal(true); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Escrow Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-4">Create Secure Escrow</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Seller Username</label>
                  <input
                    type="text"
                    value={newEscrow.sellerId}
                    onChange={(e) => setNewEscrow({ ...newEscrow, sellerId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter seller's username"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={newEscrow.title}
                    onChange={(e) => setNewEscrow({ ...newEscrow, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Instagram Account Purchase"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={newEscrow.description}
                    onChange={(e) => setNewEscrow({ ...newEscrow, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe what you're buying"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Amount</label>
                    <input
                      type="number"
                      value={newEscrow.amount}
                      onChange={(e) => setNewEscrow({ ...newEscrow, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Currency</label>
                    <select
                      value={newEscrow.currency}
                      onChange={(e) => setNewEscrow({ ...newEscrow, currency: e.target.value as 'NGN' | 'USD' })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    💡 Money will be held securely until you confirm delivery. Auto-releases after 1 hour.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEscrow}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create & Pay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChatModal && selectedEscrow && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full h-[600px] flex flex-col">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-white">Escrow Chat - {selectedEscrow.title}</h3>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  chatMessages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.senderId === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-gray-200'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">{formatDate(msg.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedEscrow && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Escrow Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{selectedEscrow.title}</h3>
                  {getStatusBadge(selectedEscrow.status)}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                  <p className="text-white">{selectedEscrow.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Amount</h4>
                    <p className="text-green-400 font-semibold">{formatCurrency(selectedEscrow.amount, selectedEscrow.currency)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Fee (0.5%)</h4>
                    <p className="text-orange-400 font-semibold">{formatCurrency(selectedEscrow.fee, selectedEscrow.currency)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Participants</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-400">Buyer:</span>
                      <span className="text-blue-400">{selectedEscrow.buyer?.username || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400">Seller:</span>
                      <span className="text-green-400">{selectedEscrow.seller?.username || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">{formatDate(selectedEscrow.createdAt)}</span>
                    </div>
                    {selectedEscrow.fundedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Funded:</span>
                        <span className="text-green-400">{formatDate(selectedEscrow.fundedAt)}</span>
                      </div>
                    )}
                    {selectedEscrow.releasedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Released:</span>
                        <span className="text-blue-400">{formatDate(selectedEscrow.releasedAt)}</span>
                      </div>
                    )}
                    {selectedEscrow.autoReleaseAt && selectedEscrow.status === 'FUNDED' && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Auto-Release:</span>
                        <span className="text-orange-400">{formatDate(selectedEscrow.autoReleaseAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show delivery notes if available */}
                {selectedEscrow.status === 'FUNDED' && selectedEscrow.sellerId === user?.id && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-300 mb-2">📦 Delivery Instructions</h4>
                    <p className="text-xs text-gray-400">
                      Once you've delivered the item/service, click "Mark as Delivered" and provide the login credentials or delivery proof to the buyer.
                    </p>
                  </div>
                )}

                {/* Show delivery credentials to buyer */}
                {selectedEscrow.status === 'FUNDED' && selectedEscrow.buyerId === user?.id && selectedEscrow.adminNotes && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-300 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      🎉 Delivery Details Received!
                    </h4>
                    <div className="bg-slate-800 rounded p-3 mt-2">
                      <pre className="text-xs text-white whitespace-pre-wrap font-mono">{selectedEscrow.adminNotes}</pre>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      ⚠️ Test the credentials above. If everything works, click "Confirm & Release Payment" below.
                    </p>
                  </div>
                )}

                {/* Show waiting message for buyer if no delivery yet */}
                {selectedEscrow.status === 'FUNDED' && selectedEscrow.buyerId === user?.id && !selectedEscrow.adminNotes && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-yellow-300 mb-2">⏳ Waiting for Delivery</h4>
                    <p className="text-xs text-gray-400">
                      The seller will provide login credentials or delivery proof. Once received, verify and confirm to release payment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Modal (Seller provides credentials) */}
        {showDeliveryModal && selectedEscrow && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">📦 Provide Delivery Details</h2>
                <button
                  onClick={() => { setShowDeliveryModal(false); setDeliveryNotes(''); }}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    💡 Provide login credentials, access details, or proof of delivery. The buyer will verify before releasing payment.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Login Credentials / Delivery Details
                  </label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                    placeholder="Example:&#10;&#10;Username: user123&#10;Password: pass456&#10;Email: email@example.com&#10;&#10;Or provide tracking number, access link, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {deliveryNotes.length} characters
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">
                    ⚠️ Make sure all details are correct. The buyer will test the credentials before confirming.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowDeliveryModal(false); setDeliveryNotes(''); }}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDelivery}
                  disabled={!deliveryNotes.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Send to Buyer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscrowPage;
