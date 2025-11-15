"use client";

import { useState, useEffect } from 'react';
import { 
  IoSearchOutline,
  IoFilterOutline,
  IoShieldCheckmarkOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoWarningOutline,
  IoEyeOutline,
  IoChatbubbleEllipsesOutline,
  IoDocumentTextOutline,
  IoRefreshOutline
} from 'react-icons/io5';

interface EscrowTransaction {
  id: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  listingTitle: string;
  amount: number;
  status: 'pending' | 'delivered' | 'released' | 'disputed' | 'refunded';
  createdAt: string;
  deliveredAt?: string;
  autoReleaseAt: string;
  proofUploaded: boolean;
  disputeReason?: string;
  adminNotes?: string;
}

type EscrowFilter = 'all' | 'pending' | 'delivered' | 'disputed' | 'released' | 'refunded';

export default function EscrowManagement() {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<EscrowFilter>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setTransactions([
        {
          id: 'ESC001',
          buyerId: 'buyer1',
          buyerName: 'John Doe',
          sellerId: 'seller1',
          sellerName: 'Jane Smith',
          listingTitle: 'Call of Duty Account - Level 150',
          amount: 45000,
          status: 'delivered',
          createdAt: '2024-01-20T10:00:00Z',
          deliveredAt: '2024-01-20T14:30:00Z',
          autoReleaseAt: '2024-01-22T14:30:00Z',
          proofUploaded: true
        },
        {
          id: 'ESC002',
          buyerId: 'buyer2',
          buyerName: 'Mike Johnson',
          sellerId: 'seller2',
          sellerName: 'Sarah Wilson',
          listingTitle: 'Free Fire Account - Diamond Rank',
          amount: 25000,
          status: 'disputed',
          createdAt: '2024-01-19T15:00:00Z',
          deliveredAt: '2024-01-19T18:00:00Z',
          autoReleaseAt: '2024-01-21T18:00:00Z',
          proofUploaded: false,
          disputeReason: 'Account credentials not working'
        },
        {
          id: 'ESC003',
          buyerId: 'buyer3',
          buyerName: 'David Brown',
          sellerId: 'seller3',
          sellerName: 'Lisa Davis',
          listingTitle: 'PUBG Mobile Account - Conqueror',
          amount: 35000,
          status: 'pending',
          createdAt: '2024-01-21T09:00:00Z',
          autoReleaseAt: '2024-01-23T09:00:00Z',
          proofUploaded: false
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.listingTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = activeFilter === 'all' || transaction.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const handleEscrowAction = (transactionId: string, action: 'release' | 'refund') => {
    setTransactions(transactions.map(transaction => 
      transaction.id === transactionId 
        ? { ...transaction, status: action === 'release' ? 'released' : 'refunded' }
        : transaction
    ));
    setShowModal(false);
  };

  const handleAddNote = (transactionId: string, note: string) => {
    setTransactions(transactions.map(transaction => 
      transaction.id === transactionId 
        ? { ...transaction, adminNotes: note }
        : transaction
    ));
    setAdminNote('');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      delivered: 'bg-blue-100 text-blue-800 border-blue-200',
      released: 'bg-green-100 text-green-800 border-green-200',
      disputed: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTimeRemaining = (autoReleaseAt: string) => {
    const now = new Date();
    const releaseTime = new Date(autoReleaseAt);
    const diff = releaseTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Escrow Management</h1>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Escrow Management</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all escrow transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-foreground text-white rounded-lg hover:bg-brand-foreground/90 transition-colors">
          <IoRefreshOutline className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
          <p className="text-sm text-muted-foreground">Total Escrows</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{transactions.filter(t => t.status === 'pending').length}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">{transactions.filter(t => t.status === 'delivered').length}</p>
          <p className="text-sm text-muted-foreground">Delivered</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{transactions.filter(t => t.status === 'disputed').length}</p>
          <p className="text-sm text-muted-foreground">Disputed</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{transactions.filter(t => t.status === 'released').length}</p>
          <p className="text-sm text-muted-foreground">Released</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by transaction ID, buyer, seller, or listing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-foreground/20 focus:border-brand-foreground"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <IoFilterOutline className="w-4 h-4 text-muted-foreground" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as EscrowFilter)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-foreground/20 focus:border-brand-foreground"
            >
              <option value="all">All Transactions</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
              <option value="disputed">Disputed</option>
              <option value="released">Released</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Transaction</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Parties</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Auto Release</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-border hover:bg-background/50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{transaction.id}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-48">{transaction.listingTitle}</p>
                      <p className="text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Buyer</span>
                        <span className="text-sm text-foreground">{transaction.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Seller</span>
                        <span className="text-sm text-foreground">{transaction.sellerName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-foreground">{formatCurrency(transaction.amount)}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(transaction.status)}
                      {transaction.proofUploaded && (
                        <IoDocumentTextOutline className="w-4 h-4 text-green-500" title="Proof uploaded" />
                      )}
                      {transaction.status === 'disputed' && (
                        <IoWarningOutline className="w-4 h-4 text-red-500" title="Disputed" />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {transaction.status === 'delivered' && (
                      <div className="flex items-center gap-2">
                        <IoTimeOutline className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{getTimeRemaining(transaction.autoReleaseAt)}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowModal(true);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <IoEyeOutline className="w-4 h-4" />
                      </button>
                      {(transaction.status === 'delivered' || transaction.status === 'disputed') && (
                        <>
                          <button
                            onClick={() => handleEscrowAction(transaction.id, 'release')}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                            title="Release Funds"
                          >
                            <IoCheckmarkCircleOutline className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEscrowAction(transaction.id, 'refund')}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Refund Buyer"
                          >
                            <IoCloseCircleOutline className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <IoShieldCheckmarkOutline className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No escrow transactions found</p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Transaction Details</h3>
              <p className="text-sm text-muted-foreground">{selectedTransaction.id}</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Listing</p>
                  <p className="text-foreground">{selectedTransaction.listingTitle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-foreground font-medium">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Buyer</p>
                  <p className="text-foreground">{selectedTransaction.buyerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Seller</p>
                  <p className="text-foreground">{selectedTransaction.sellerName}</p>
                </div>
              </div>

              {/* Status and Timeline */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                {getStatusBadge(selectedTransaction.status)}
              </div>

              {/* Dispute Reason */}
              {selectedTransaction.disputeReason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Dispute Reason</p>
                  <p className="text-foreground bg-red-50 p-3 rounded-lg">{selectedTransaction.disputeReason}</p>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Admin Notes</p>
                <textarea
                  value={adminNote || selectedTransaction.adminNotes || ''}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add admin notes..."
                  className="w-full p-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-foreground/20 focus:border-brand-foreground"
                  rows={3}
                />
                {adminNote && (
                  <button
                    onClick={() => handleAddNote(selectedTransaction.id, adminNote)}
                    className="mt-2 px-3 py-1 bg-brand-foreground text-white text-sm rounded-lg hover:bg-brand-foreground/90 transition-colors"
                  >
                    Save Note
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
              <div className="flex gap-2">
                {(selectedTransaction.status === 'delivered' || selectedTransaction.status === 'disputed') && (
                  <>
                    <button
                      onClick={() => handleEscrowAction(selectedTransaction.id, 'refund')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Refund Buyer
                    </button>
                    <button
                      onClick={() => handleEscrowAction(selectedTransaction.id, 'release')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Release Funds
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}