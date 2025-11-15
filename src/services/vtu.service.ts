import { authApi } from '../lib/auth-api';

export interface VTUProvider {
  id: string;
  name: string;
  code: string;
  type: 'TELECOM' | 'CABLE' | 'ELECTRICITY';
  isActive: boolean;
}

export interface DataPlan {
  id: string;
  name: string;
  amount: number;
  validity: string;
  network: string;
}

export interface CablePlan {
  id: string;
  name: string;
  amount: number;
  provider: string;
}

export interface VTUService {
  id: string;
  name: string;
  description: string;
}

export interface VTUTransaction {
  id: string;
  type: 'AIRTIME' | 'DATA' | 'CABLE' | 'ELECTRICITY';
  provider: string;
  recipient: string;
  amount: number;
  fee: number;
  currency: string;
  reference: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  providerReference?: string;
  processedAt?: string;
  createdAt: string;
  metadata?: any;
}

export interface AirtimeRequest {
  network: string;
  phoneNumber: string;
  amount: number;
}

export interface DataRequest {
  network: string;
  phoneNumber: string;
  planId: string;
  amount: number;
}

export interface CableRequest {
  provider: string;
  decoderNumber: string;
  planId: string;
  amount: number;
}

export interface ElectricityRequest {
  provider: string;
  meterNumber: string;
  meterType: 'PREPAID' | 'POSTPAID';
  amount: number;
}

export interface VTUResponse {
  success: boolean;
  message: string;
  data?: {
    reference: string;
    providerReference?: string;
  };
}

export interface VTUTransactionListResponse {
  success: boolean;
  message: string;
  data: {
    transactions: VTUTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class VTUServiceClass {
  // Get available VTU services
  async getServices(): Promise<VTUService[]> {
    const response = await authApi.get('/api/vtu/services');
    return response.data.data;
  }

  // Get available networks/providers
  async getProviders(): Promise<VTUProvider[]> {
    const response = await authApi.get('/api/vtu/networks');
    return response.data.data;
  }

  // Get data plans for a specific network
  async getDataPlans(network: string): Promise<DataPlan[]> {
    const response = await authApi.get(`/api/vtu/data-plans/${network}`);
    return response.data.data;
  }

  // Get cable TV plans for a provider
  async getCablePlans(provider: string): Promise<CablePlan[]> {
    const response = await authApi.get(`/api/vtu/cable-plans/${provider}`);
    return response.data.data;
  }

  // Purchase airtime
  async purchaseAirtime(request: AirtimeRequest): Promise<VTUResponse> {
    const response = await authApi.post('/api/vtu/airtime', request);
    return response.data;
  }

  // Purchase data
  async purchaseData(request: DataRequest): Promise<VTUResponse> {
    const response = await authApi.post('/api/vtu/data', request);
    return response.data;
  }

  // Purchase cable TV subscription
  async purchaseCableTV(request: CableRequest): Promise<VTUResponse> {
    const response = await authApi.post('/api/vtu/cable-tv', request);
    return response.data;
  }

  // Purchase electricity
  async purchaseElectricity(request: ElectricityRequest): Promise<VTUResponse> {
    const response = await authApi.post('/api/vtu/electricity', request);
    return response.data;
  }

  // Get VTU transaction history
  async getTransactions(page: number = 1, limit: number = 20): Promise<VTUTransactionListResponse> {
    const response = await authApi.get(`/api/vtu/transactions?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Utility functions
  formatCurrency(amount: number, currency: string = 'NGN'): string {
    const symbol = currency === 'NGN' ? '₦' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  }

  getProviderIcon(provider: string): string {
    const icons: Record<string, string> = {
      MTN: '🟡',
      GLO: '🟢',
      AIRTEL: '🔴',
      '9MOBILE': '🟣',
      DSTV: '📺',
      GOTV: '📺',
      STARTIMES: '📺',
      EKEDC: '⚡',
      IKEDC: '⚡',
    };
    return icons[provider.toUpperCase()] || '📱';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'AIRTIME':
        return '📞';
      case 'DATA':
        return '📶';
      case 'CABLE':
        return '📺';
      case 'ELECTRICITY':
        return '⚡';
      default:
        return '📱';
    }
  }

  calculateFee(amount: number): number {
    return amount * 0.02; // 2% fee
  }

  getTotalAmount(amount: number): number {
    return amount + this.calculateFee(amount);
  }
}

export const VTUService = new VTUServiceClass();