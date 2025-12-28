import { authApi } from '@/lib/auth-api';

export interface CreateEscrowRequest {
  sellerId: string;
  postId?: string;
  amount: number;
  currency: 'NGN' | 'USD';
  title: string;
  description: string;
  terms?: string;
  autoReleaseHours?: number;
}

export interface EscrowResponse {
  id: string;
  buyerId: string;
  sellerId: string;
  postId?: string;
  amount: number;
  fee: number;
  currency: 'NGN' | 'USD';
  status: 'PENDING' | 'FUNDED' | 'DISPUTED' | 'RELEASED' | 'CANCELLED' | 'REFUNDED';
  title: string;
  description: string;
  terms?: string;
  disputeReason?: string;
  adminNotes?: string; // This contains delivery notes from seller
  fundedAt?: string;
  releasedAt?: string;
  disputedAt?: string;
  autoReleaseAt?: string;
  createdAt: string;
  updatedAt: string;
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
    price: number;
    currency: string;
  };
}

export interface EscrowListResponse {
  escrows: EscrowResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EscrowMessage {
  id: string;
  escrowId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export class EscrowService {
  /**
   * Create a new escrow transaction
   */
  static async createEscrow(accessToken: string, data: CreateEscrowRequest): Promise<EscrowResponse> {
    const response = await authApi.post('/api/escrow', data);
    return response.data;
  }

  /**
   * Get user's escrow transactions with pagination
   */
  static async getUserEscrows(accessToken: string, page = 1, limit = 10): Promise<EscrowListResponse> {
    const response = await authApi.get(`/api/escrow?page=${page}&limit=${limit}`);
    return response.data;
  }

  /**
   * Get specific escrow by ID
   */
  static async getEscrowById(accessToken: string, escrowId: string): Promise<EscrowResponse> {
    const response = await authApi.get(`/api/escrow/${escrowId}`);
    return response.data;
  }

  /**
   * Accept an escrow (seller action)
   */
  static async acceptEscrow(accessToken: string, escrowId: string): Promise<EscrowResponse> {
    const response = await authApi.post(`/api/escrow/${escrowId}/accept`, {});
    return response.data;
  }

  /**
   * Reject an escrow (seller action)
   */
  static async rejectEscrow(accessToken: string, escrowId: string, reason?: string): Promise<EscrowResponse> {
    const response = await authApi.post(`/api/escrow/${escrowId}/reject`, {
      reason
    });
    return response.data;
  }

  /**
   * Fund an escrow (buyer action)
   */
  static async fundEscrow(accessToken: string, escrowId: string): Promise<EscrowResponse> {
    const response = await authApi.post(`/api/escrow/${escrowId}/fund`, {});
    return response.data;
  }

  /**
   * Mark escrow as delivered (seller action)
   */
  static async markAsDelivered(accessToken: string, escrowId: string, deliveryNotes?: string): Promise<EscrowResponse> {
    const response = await authApi.post(`/api/escrow/${escrowId}/deliver`, {
      deliveryNotes
    });
    return response.data;
  }

  /**
   * Confirm delivery (buyer action)
   */
  static async confirmDelivery(accessToken: string, escrowId: string): Promise<EscrowResponse> {
    const response = await authApi.post(`/api/escrow/${escrowId}/confirm`, {});
    return response.data;
  }

  /**
   * Create a dispute
   */
  static async createDispute(accessToken: string, escrowId: string, reason: string): Promise<EscrowResponse> {
    const response = await authApi.post(`/api/escrow/${escrowId}/dispute`, {
      reason
    });
    return response.data;
  }

  /**
   * Cancel an escrow
   */
  static async cancelEscrow(accessToken: string, escrowId: string): Promise<EscrowResponse> {
    const response = await authApi.post(`/api/escrow/${escrowId}/cancel`, {});
    return response.data;
  }

  /**
   * Extend escrow deadline
   */
  static async extendDeadline(accessToken: string, escrowId: string, additionalHours: number): Promise<EscrowResponse> {
    const response = await authApi.put(`/api/escrow/${escrowId}/extend`, {
      additionalHours
    });
    return response.data;
  }

  /**
   * Get escrow messages
   */
  static async getEscrowMessages(accessToken: string, escrowId: string): Promise<EscrowMessage[]> {
    const response = await authApi.get(`/api/escrow/${escrowId}/messages`);
    return response.data;
  }

  /**
   * Send escrow message
   */
  static async sendEscrowMessage(accessToken: string, escrowId: string, message: string): Promise<EscrowMessage> {
    const response = await authApi.post(`/api/escrow/${escrowId}/messages`, {
      message
    });
    return response.data;
  }

  /**
   * Calculate escrow fee (0.5% of amount)
   */
  static calculateFee(amount: number): number {
    return Math.round(amount * 0.005 * 100) / 100; // 0.5% fee, rounded to 2 decimal places
  }

  /**
   * Get total amount including fee
   */
  static getTotalAmount(amount: number): number {
    return amount + this.calculateFee(amount);
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency: 'NGN' | 'USD' | 'LMC'): string {
    if (currency === 'LMC') {
      return `${amount.toLocaleString()} LMC`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get escrow status color for UI
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'FUNDED':
        return 'blue';
      case 'DISPUTED':
        return 'red';
      case 'RELEASED':
        return 'green';
      case 'CANCELLED':
        return 'gray';
      case 'REFUNDED':
        return 'purple';
      default:
        return 'gray';
    }
  }

  /**
   * Check if user can perform action on escrow
   */
  static canPerformAction(
    escrow: EscrowResponse, 
    userId: string, 
    action: 'accept' | 'reject' | 'fund' | 'deliver' | 'confirm' | 'dispute' | 'cancel'
  ): boolean {
    const isBuyer = escrow.buyerId === userId;
    const isSeller = escrow.sellerId === userId;

    switch (action) {
      case 'accept':
      case 'reject':
        return isSeller && escrow.status === 'PENDING';
      case 'fund':
        return isBuyer && escrow.status === 'PENDING';
      case 'deliver':
        return isSeller && escrow.status === 'FUNDED';
      case 'confirm':
      case 'dispute':
        return isBuyer && escrow.status === 'FUNDED';
      case 'cancel':
        return (isBuyer || isSeller) && ['PENDING', 'FUNDED'].includes(escrow.status);
      default:
        return false;
    }
  }

  /**
   * Get available actions for user on escrow
   */
  static getAvailableActions(escrow: EscrowResponse, userId: string): string[] {
    const actions: string[] = [];
    
    if (this.canPerformAction(escrow, userId, 'accept')) actions.push('accept');
    if (this.canPerformAction(escrow, userId, 'reject')) actions.push('reject');
    if (this.canPerformAction(escrow, userId, 'fund')) actions.push('fund');
    if (this.canPerformAction(escrow, userId, 'deliver')) actions.push('deliver');
    if (this.canPerformAction(escrow, userId, 'confirm')) actions.push('confirm');
    if (this.canPerformAction(escrow, userId, 'dispute')) actions.push('dispute');
    if (this.canPerformAction(escrow, userId, 'cancel')) actions.push('cancel');

    return actions;
  }

  /**
   * Get time remaining until auto-release
   */
  static getTimeUntilAutoRelease(autoReleaseAt: string): {
    days: number;
    hours: number;
    minutes: number;
    expired: boolean;
  } {
    const now = new Date();
    const releaseDate = new Date(autoReleaseAt);
    const diff = releaseDate.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, expired: false };
  }

  /**
   * Format time remaining
   */
  static formatTimeRemaining(autoReleaseAt: string): string {
    const { days, hours, minutes, expired } = this.getTimeUntilAutoRelease(autoReleaseAt);

    if (expired) {
      return 'Expired';
    }

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }
}

export default EscrowService;