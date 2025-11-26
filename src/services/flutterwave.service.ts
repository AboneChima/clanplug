import axios from 'axios';
import config from '../config/config';

interface TransferRequest {
  accountBank: string;
  accountNumber: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  callbackUrl?: string;
  debitCurrency?: string;
  beneficiaryName?: string;
}

interface TransferResponse {
  status: string;
  message: string;
  data: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    debit_currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    meta: any;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
  };
}

interface BalanceResponse {
  status: string;
  message: string;
  data: {
    currency: string;
    available_balance: number;
    ledger_balance: number;
  }[];
}

class FlutterwaveService {
  private baseUrl = 'https://api.flutterwave.com/v3';
  private secretKey = config.FLUTTERWAVE_SECRET_KEY;

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get Flutterwave wallet balance
   */
  async getBalance(): Promise<{ NGN: number; USD: number }> {
    try {
      const response = await axios.get<BalanceResponse>(
        `${this.baseUrl}/balances`,
        { headers: this.getHeaders() }
      );

      if (response.data.status === 'success') {
        const balances = response.data.data;
        const ngnBalance = balances.find(b => b.currency === 'NGN')?.available_balance || 0;
        const usdBalance = balances.find(b => b.currency === 'USD')?.available_balance || 0;
        
        return { NGN: ngnBalance, USD: usdBalance };
      }

      throw new Error('Failed to fetch balance');
    } catch (error: any) {
      console.error('Flutterwave balance check failed:', error.response?.data || error.message);
      throw new Error('Failed to check Flutterwave balance');
    }
  }

  /**
   * Initiate instant transfer to bank account
   */
  async initiateTransfer(data: TransferRequest): Promise<TransferResponse['data']> {
    try {
      console.log('Initiating Flutterwave transfer:', {
        amount: data.amount,
        account: data.accountNumber,
        bank: data.accountBank,
        reference: data.reference
      });

      const response = await axios.post<TransferResponse>(
        `${this.baseUrl}/transfers`,
        data,
        { headers: this.getHeaders() }
      );

      if (response.data.status === 'success') {
        console.log('Transfer initiated successfully:', response.data.data);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Transfer failed');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Flutterwave transfer failed:', error.response?.data || error.message);
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify transfer status
   */
  async verifyTransfer(transferId: number): Promise<TransferResponse['data']> {
    try {
      const response = await axios.get<TransferResponse>(
        `${this.baseUrl}/transfers/${transferId}`,
        { headers: this.getHeaders() }
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }

      throw new Error('Failed to verify transfer');
    } catch (error: any) {
      console.error('Transfer verification failed:', error.response?.data || error.message);
      throw new Error('Failed to verify transfer status');
    }
  }

  /**
   * Get transfer fee
   */
  async getTransferFee(amount: number): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transfers/fee?amount=${amount}&currency=NGN`,
        { headers: this.getHeaders() }
      );

      if (response.data.status === 'success') {
        return response.data.data[0]?.fee || 0;
      }

      return 0;
    } catch (error) {
      console.error('Failed to get transfer fee:', error);
      return 0; // Return 0 if fee check fails
    }
  }

  /**
   * Check if instant transfer is available
   */
  async canProcessInstantTransfer(amount: number): Promise<{ canProcess: boolean; reason?: string }> {
    try {
      // Check Flutterwave balance
      const balance = await this.getBalance();
      
      if (balance.NGN < amount) {
        return {
          canProcess: false,
          reason: `Insufficient Flutterwave balance. Available: ₦${balance.NGN.toLocaleString()}, Required: ₦${amount.toLocaleString()}`
        };
      }

      return { canProcess: true };
    } catch (error) {
      return {
        canProcess: false,
        reason: 'Unable to verify Flutterwave balance'
      };
    }
  }
}

export const flutterwaveService = new FlutterwaveService();
