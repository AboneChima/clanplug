import axios, { AxiosInstance } from 'axios';
import config from '../config/config';

export interface ClubKonnectBalanceResponse {
  status: string;
  balance: string;
  message?: string;
}

export interface ClubKonnectAirtimeRequest {
  UserID: string;
  APIKey: string;
  MobileNetwork: string;
  Amount: string;
  MobileNumber: string;
  RequestID: string;
}

export interface ClubKonnectDataRequest {
  UserID: string;
  APIKey: string;
  MobileNetwork: string;
  DataPlan: string;
  MobileNumber: string;
  RequestID: string;
}

export interface ClubKonnectResponse {
  status: string;
  message: string;
  transactionid?: string;
  requestid?: string;
}

class ClubKonnectService {
  private api: AxiosInstance;
  private userId: string;
  private apiKey: string;

  constructor() {
    this.userId = config.CLUBKONNECT_USERID;
    this.apiKey = config.CLUBKONNECT_APIKEY;
    
    this.api = axios.create({
      baseURL: config.CLUBKONNECT_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[ClubKonnect] ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`[ClubKonnect] Request:`, JSON.stringify(config.data));
        return config;
      },
      (error) => {
        console.error('[ClubKonnect] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.api.interceptors.response.use(
      (response) => {
        console.log(`[ClubKonnect] Response:`, response.status, JSON.stringify(response.data));
        return response;
      },
      (error) => {
        console.error('[ClubKonnect] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check ClubKonnect wallet balance
   */
  async checkBalance(): Promise<ClubKonnectBalanceResponse> {
    try {
      const response = await this.api.get('/APIWalletBalanceV1.asp', {
        params: {
          UserID: this.userId,
          APIKey: this.apiKey,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('[ClubKonnect] Balance check failed:', error);
      throw new Error('Failed to check ClubKonnect balance');
    }
  }

  /**
   * Purchase airtime via ClubKonnect
   */
  async purchaseAirtime(
    network: string,
    amount: number,
    phoneNumber: string,
    requestId: string
  ): Promise<ClubKonnectResponse> {
    try {
      const payload: ClubKonnectAirtimeRequest = {
        UserID: this.userId,
        APIKey: this.apiKey,
        MobileNetwork: network.toUpperCase(),
        Amount: amount.toString(),
        MobileNumber: phoneNumber,
        RequestID: requestId,
      };

      console.log('[ClubKonnect] Purchasing airtime:', payload);

      const response = await this.api.post('/APIAirtimeV1.asp', payload);

      return response.data;
    } catch (error: any) {
      console.error('[ClubKonnect] Airtime purchase failed:', error);
      throw new Error(error.response?.data?.message || 'Airtime purchase failed');
    }
  }

  /**
   * Purchase data bundle via ClubKonnect
   */
  async purchaseData(
    network: string,
    dataPlan: string,
    phoneNumber: string,
    requestId: string
  ): Promise<ClubKonnectResponse> {
    try {
      const payload: ClubKonnectDataRequest = {
        UserID: this.userId,
        APIKey: this.apiKey,
        MobileNetwork: network.toUpperCase(),
        DataPlan: dataPlan,
        MobileNumber: phoneNumber,
        RequestID: requestId,
      };

      console.log('[ClubKonnect] Purchasing data:', payload);

      const response = await this.api.post('/APIDataV1.asp', payload);

      return response.data;
    } catch (error: any) {
      console.error('[ClubKonnect] Data purchase failed:', error);
      throw new Error(error.response?.data?.message || 'Data purchase failed');
    }
  }

  /**
   * Get available data plans for a network
   */
  getDataPlans(network: string): Array<{ id: string; name: string; amount: number; validity: string }> {
    const plans: Record<string, Array<{ id: string; name: string; amount: number; validity: string }>> = {
      MTN: [
        { id: 'MTN-1GB-30', name: '1GB - 30 Days', amount: 280, validity: '30 days' },
        { id: 'MTN-2GB-30', name: '2GB - 30 Days', amount: 560, validity: '30 days' },
        { id: 'MTN-3GB-30', name: '3GB - 30 Days', amount: 840, validity: '30 days' },
        { id: 'MTN-5GB-30', name: '5GB - 30 Days', amount: 1400, validity: '30 days' },
        { id: 'MTN-10GB-30', name: '10GB - 30 Days', amount: 2800, validity: '30 days' },
      ],
      GLO: [
        { id: 'GLO-1GB-30', name: '1GB - 30 Days', amount: 280, validity: '30 days' },
        { id: 'GLO-2GB-30', name: '2GB - 30 Days', amount: 560, validity: '30 days' },
        { id: 'GLO-3GB-30', name: '3GB - 30 Days', amount: 840, validity: '30 days' },
        { id: 'GLO-5GB-30', name: '5GB - 30 Days', amount: 1400, validity: '30 days' },
      ],
      AIRTEL: [
        { id: 'AIRTEL-1GB-30', name: '1GB - 30 Days', amount: 280, validity: '30 days' },
        { id: 'AIRTEL-2GB-30', name: '2GB - 30 Days', amount: 560, validity: '30 days' },
        { id: 'AIRTEL-3GB-30', name: '3GB - 30 Days', amount: 840, validity: '30 days' },
        { id: 'AIRTEL-5GB-30', name: '5GB - 30 Days', amount: 1400, validity: '30 days' },
      ],
      '9MOBILE': [
        { id: '9MOBILE-1GB-30', name: '1GB - 30 Days', amount: 285, validity: '30 days' },
        { id: '9MOBILE-2GB-30', name: '2GB - 30 Days', amount: 680, validity: '30 days' },
        { id: '9MOBILE-3GB-30', name: '3GB - 30 Days', amount: 1020, validity: '30 days' },
        { id: '9MOBILE-5GB-30', name: '5GB - 30 Days', amount: 1700, validity: '30 days' },
      ],
    };

    return plans[network.toUpperCase()] || [];
  }
}

export const clubKonnectService = new ClubKonnectService();
