'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Plus,
  Eye,
  MessageSquare,
  Calendar,
  DollarSign,
  User,
  Package,
  FileText,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import EscrowService, { 
  EscrowResponse, 
  CreateEscrowRequest 
} from '@/services/escrow.service';
import { useVisibilityRefresh } from '@/hooks/usePageVisibility';

const EscrowPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const [escrows, setEscrows] = useState<EscrowResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Create escrow form state
  const [newEscrow, setNewEscrow] = useState<CreateEscrowRequest>({
    sellerId: '',
    amount: 0,
    currency: 'NGN',
    title: '',
    description: '',
    terms: '',
    autoReleaseHours: 168 // 7 days default
  });

  // Dispute form state
  const [disputeReason, setDisputeReason] = useState('');

  // Load escrows
  const loadEscrows = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await EscrowService.getUserEscrows(accessToken);
      setEscrows(data.escrows);
    } catch (error) {
      console.error('Failed to load escrows:', error);
      showToast('Failed to load escrows', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Use visibility refresh hook to handle tab switching
  const { isVisible } = useVisibilityRefresh(loadEscrows, [user], {
    refreshOnVisible: true,
    refreshDelay: 1000,
    enabled: !!user
  });

  // Handle case when there's no user
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setEscrows([]);
    }
  }, [user]);

  // Filter escrows
  const filteredEscrows = escrows.filter(escrow => {
    const matchesStatus = filterStatus === 'all' || escrow.status === filterStatus;
    const matchesSearch = escrow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escrow.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Status badge component
  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'PENDING':
          return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
        case 'FUNDED':
          return { color: 'bg-blue-100 text-blue-800', icon: DollarSign };
        case 'DISPUTED':
          return { color: 'bg-red-100 text-red-800', icon: AlertTriangle };
        case 'RELEASED':
          return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
        case 'CANCELLED':
          return { color: 'bg-gray-100 text-gray-800', icon: XCircle };
        case 'REFUNDED':
          return { color: 'bg-purple-100 text-purple-800', icon: RefreshCw };
        default:
          return { color: 'bg-gray-100 text-gray-800', icon: Clock };
      }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return EscrowService.formatCurrency(amount, currency as 'NGN' | 'USD' | 'LMC');
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle escrow actions
  const handleFundEscrow = async (escrowId: string) => {
    if (!accessToken) return;
    try {
      await EscrowService.fundEscrow(accessToken, escrowId);
      showToast('Escrow funded successfully', 'success');
      await loadEscrows();
    } catch (error) {
      console.error('Failed to fund escrow:', error);
      showToast('Failed to fund escrow', 'error');
    }
  };

  const handleAcceptEscrow = async (escrowId: string) => {
    if (!accessToken) return;
    try {
      await EscrowService.acceptEscrow(accessToken, escrowId);
      showToast('Escrow accepted successfully', 'success');
      await loadEscrows();
    } catch (error) {
      console.error('Failed to accept escrow:', error);
      showToast('Failed to accept escrow', 'error');
    }
  };

  const handleMarkDelivered = async (escrowId: string) => {
    if (!accessToken) return;
    try {
      await EscrowService.markAsDelivered(accessToken, escrowId);
      showToast('Marked as delivered successfully', 'success');
      await loadEscrows();
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
      showToast('Failed to mark as delivered', 'error');
    }
  };

  const handleConfirmDelivery = async (escrowId: string) => {
    if (!accessToken) return;
    try {
      await EscrowService.confirmDelivery(accessToken, escrowId);
      showToast('Delivery confirmed successfully', 'success');
      await loadEscrows();
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
      showToast('Failed to confirm delivery', 'error');
    }
  };

  const handleCreateDispute = async (escrowId: string, reason: string) => {
    if (!accessToken) return;
    try {
      await EscrowService.createDispute(accessToken, escrowId, reason);
      showToast('Dispute created successfully', 'success');
      setShowDisputeModal(false);
      setDisputeReason('');
      await loadEscrows();
    } catch (error) {
      console.error('Failed to create dispute:', error);
      showToast('Failed to create dispute', 'error');
    }
  };

  const handleCreateEscrow = async () => {
    if (!accessToken) return;
    try {
      await EscrowService.createEscrow(accessToken, newEscrow);
      showToast('Escrow created successfully', 'success');
      setShowCreateModal(false);
      setNewEscrow({
        sellerId: '',
        amount: 0,
        currency: 'NGN',
        title: '',
        description: '',
        terms: '',
        autoReleaseHours: 168
      });
      await loadEscrows();
    } catch (error) {
      console.error('Failed to create escrow:', error);
      showToast('Failed to create escrow', 'error');
    }
  };

  // Get available actions for escrow
  const getAvailableActions = (escrow: EscrowResponse) => {
    if (!user) return [];
    
    const actions: Array<{ label: string; action: () => void; color: string }> = [];
    const availableActions = EscrowService.getAvailableActions(escrow, user.id);

    availableActions.forEach(action => {
      switch (action) {
        case 'accept':
          actions.push({ label: 'Accept', action: () => handleAcceptEscrow(escrow.id), color: 'bg-green-600' });
          break;
        case 'fund':
          actions.push({ label: 'Fund', action: () => handleFundEscrow(escrow.id), color: 'bg-blue-600' });
          break;
        case 'deliver':
          actions.push({ label: 'Mark Delivered', action: () => handleMarkDelivered(escrow.id), color: 'bg-green-600' });
          break;
        case 'confirm':
          actions.push({ label: 'Confirm Delivery', action: () => handleConfirmDelivery(escrow.id), color: 'bg-green-600' });
          break;
        case 'dispute':
          actions.push({ label: 'Dispute', action: () => { setSelectedEscrow(escrow); setShowDisputeModal(true); }, color: 'bg-red-600' });
          break;
      }
    });

    return actions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center mb-2">
                <Shield className="w-10 h-10 mr-4 text-blue-400" />
                Escrow Transactions
              </h1>
              <p className="text-gray-400 text-lg">
                Secure transactions with built-in buyer and seller protection
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg shadow-blue-500/25 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Escrow
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Escrows</p>
                  <p className="text-2xl font-bold text-white">{escrows.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {escrows.filter(e => e.status === 'RELEASED').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-white">
                    {escrows.filter(e => ['PENDING', 'FUNDED'].includes(e.status)).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Disputed</p>
                  <p className="text-2xl font-bold text-white">
                    {escrows.filter(e => e.status === 'DISPUTED').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search escrows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="FUNDED">Funded</option>
                <option value="DISPUTED">Disputed</option>
                <option value="RELEASED">Released</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Escrow List */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredEscrows.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No escrows found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first escrow transaction to get started'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Create First Escrow
                </button>
              )}
            </div>
          ) : (
            filteredEscrows.map((escrow) => (
              <div key={escrow.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{escrow.title}</h3>
                        <StatusBadge status={escrow.status} />
                      </div>
                      
                      <p className="text-gray-300 mb-4">{escrow.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                          <span>Amount: <span className="text-green-400 font-medium">{formatCurrency(escrow.amount, escrow.currency)}</span></span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <User className="w-4 h-4 mr-2 text-blue-400" />
                          <span>
                            {escrow.buyerId === user?.id ? 'Selling to' : 'Buying from'}: 
                            <span className="text-blue-400 font-medium ml-1">
                              {escrow.buyerId === user?.id ? escrow.seller.username : escrow.buyer.username}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                          <span>Created: <span className="text-purple-400">{formatDate(escrow.createdAt)}</span></span>
                        </div>
                      </div>

                      {escrow.autoReleaseAt && (
                        <div className="flex items-center text-sm text-orange-400 mb-4 bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Auto-release: {formatDate(escrow.autoReleaseAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                      {getAvailableActions(escrow).map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          className={`${action.color} text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedEscrow(escrow); setShowDetailsModal(true); }}
                        className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
                        title="Messages"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Escrow Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Create New Escrow</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Seller ID
                    </label>
                    <input
                      type="text"
                      value={newEscrow.sellerId}
                      onChange={(e) => setNewEscrow({ ...newEscrow, sellerId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter seller's user ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newEscrow.title}
                      onChange={(e) => setNewEscrow({ ...newEscrow, title: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter escrow title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newEscrow.description}
                      onChange={(e) => setNewEscrow({ ...newEscrow, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Describe what's being sold/bought"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={newEscrow.amount}
                        onChange={(e) => setNewEscrow({ ...newEscrow, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={newEscrow.currency}
                        onChange={(e) => setNewEscrow({ ...newEscrow, currency: e.target.value as 'NGN' | 'USD' })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="NGN">NGN</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Terms & Conditions (Optional)
                    </label>
                    <textarea
                      value={newEscrow.terms}
                      onChange={(e) => setNewEscrow({ ...newEscrow, terms: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Any specific terms or conditions"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Auto-release Hours (Default: 168 hours / 7 days)
                    </label>
                    <input
                      type="number"
                      value={newEscrow.autoReleaseHours}
                      onChange={(e) => setNewEscrow({ ...newEscrow, autoReleaseHours: parseInt(e.target.value) || 168 })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="1"
                      max="720"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 border border-slate-600 text-gray-300 rounded-xl hover:bg-slate-800/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEscrow}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Create Escrow
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Escrow Details Modal */}
        {showDetailsModal && selectedEscrow && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Escrow Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{selectedEscrow.title}</h3>
                      <StatusBadge status={selectedEscrow.status} />
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-1">Description</h4>
                      <p className="text-gray-300">{selectedEscrow.description}</p>
                    </div>

                    {selectedEscrow.terms && (
                      <div>
                        <h4 className="font-medium text-white mb-1">Terms & Conditions</h4>
                        <p className="text-gray-300">{selectedEscrow.terms}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-white mb-1">Amount</h4>
                        <p className="text-green-400 font-semibold">{formatCurrency(selectedEscrow.amount, selectedEscrow.currency)}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">Fee</h4>
                        <p className="text-orange-400 font-semibold">{formatCurrency(selectedEscrow.fee, selectedEscrow.currency)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Participants</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Buyer: <span className="text-blue-400">{selectedEscrow.buyer.username}</span></p>
                            <p className="text-sm text-gray-400">ID: {selectedEscrow.buyer.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                            <Package className="w-4 h-4 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Seller: <span className="text-green-400">{selectedEscrow.seller.username}</span></p>
                            <p className="text-sm text-gray-400">ID: {selectedEscrow.seller.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-2">Timeline</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Created:</span>
                          <span className="text-purple-400">{formatDate(selectedEscrow.createdAt)}</span>
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
                        {selectedEscrow.disputedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Disputed:</span>
                            <span className="text-red-400">{formatDate(selectedEscrow.disputedAt)}</span>
                          </div>
                        )}
                        {selectedEscrow.autoReleaseAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Auto-release:</span>
                            <span className="text-orange-400">{formatDate(selectedEscrow.autoReleaseAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(selectedEscrow.disputeReason || selectedEscrow.adminNotes) && (
                      <div>
                        <h4 className="font-medium text-white mb-2">Notes</h4>
                        {selectedEscrow.disputeReason && (
                          <div className="mb-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                            <p className="text-sm font-medium text-red-400">Dispute Reason:</p>
                            <p className="text-sm text-gray-300">{selectedEscrow.disputeReason}</p>
                          </div>
                        )}
                        {selectedEscrow.adminNotes && (
                          <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                            <p className="text-sm font-medium text-blue-400">Admin Notes:</p>
                            <p className="text-sm text-gray-300">{selectedEscrow.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-6 pt-6 border-t border-white/10">
                  {getAvailableActions(selectedEscrow).map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`${action.color} text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && selectedEscrow && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Create Dispute</h2>
                <p className="text-gray-300 mb-4">
                  Please provide a detailed reason for disputing this escrow transaction.
                </p>
                
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                  placeholder="Explain the issue with this transaction..."
                />

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => { setShowDisputeModal(false); setDisputeReason(''); }}
                    className="flex-1 px-6 py-3 border border-slate-600 text-gray-300 rounded-xl hover:bg-slate-800/50 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCreateDispute(selectedEscrow.id, disputeReason)}
                    disabled={!disputeReason.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    Create Dispute
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscrowPage;