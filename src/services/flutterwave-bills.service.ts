import axios from 'axios';
import config from '../config/config';

interface BillCategory {
  id: number;
  biller_code: string;
  name: string;
  default_commission: number;
  country: string;
  is_airtime: boolean;
  biller_name: string;
  item_code: string;
  short_name: string;
  fee: number;
  commission_on_fee: boolean;
  label_name: string;
  amount: number;
}

interface BillPaymentRequest {
  country: string;
  customer: string;
  amount: number;
  recurrence?: string;
  type: string;
  reference: string;
  biller_name?: string;
}

interface BillPaymentResponse {
  status: string;
  message: string;
  data: {
    phone_number: string;
    amount: number;
    network: string;
    flw_ref: string;
    reference: string;
    tx_ref: string;
  };
}

class FlutterwaveBillsService {
  private baseUrl = 'https://api.flutterwave.com/v3';
  private secretKey = config.FLUTTERWAVE_SECRET_KEY;

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all bill categories (airtime, data, etc.)
   */
  async getBillCategories(): Promise<BillCategory[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/bill-categories`,
        { headers: this.getHeaders() }
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      console.error('Failed to get bill categories:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get airtime billers
   */
  async getAirtimeBillers(): Promise<BillCategory[]> {
    try {
      const categories = await this.getBillCategories();
      return categories.filter(cat => cat.is_airtime);
    } catch (error) {
      console.error('Failed to get airtime billers:', error);
      return [];
    }
  }

  /**
   * Get data bundle plans for a network
   */
  async getDataBundles(billerCode: string): Promise<BillCategory[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/bill-categories/${billerCode}/items`,
        { headers: this.getHeaders() }
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      console.error('Failed to get data bundles:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Purchase airtime
   */
  async purchaseAirtime(
    phoneNumber: string,
    amount: number,
    billerCode: string,
    reference: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('[Flutterwave Bills] Purchasing airtime:', {
        phone: phoneNumber,
        amount,
        biller: billerCode,
        reference
      });

      const requestData: BillPaymentRequest = {
        country: 'NG',
        customer: phoneNumber,
        amount,
        type: billerCode,
        reference
      };

      const response = await axios.post<BillPaymentResponse>(
        `${this.baseUrl}/bills`,
        requestData,
        { headers: this.getHeaders() }
      );

      console.log('[Flutterwave Bills] Response:', response.data);

      if (response.data.status === 'success') {
        return {
          success: true,
          message: 'Airtime purchase successful',
          data: response.data.data
        };
      }

      return {
        success: false,
        message: response.data.message || 'Airtime purchase failed'
      };
    } catch (error: any) {
      console.error('[Flutterwave Bills] Airtime purchase failed:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to purchase airtime'
      };
    }
  }

  /**
   * Purchase data bundle
   */
  async purchaseData(
    phoneNumber: string,
    amount: number,
    billerCode: string,
    itemCode: string,
    reference: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('[Flutterwave Bills] Purchasing data:', {
        phone: phoneNumber,
        amount,
        biller: billerCode,
        item: itemCode,
        reference
      });

      const requestData = {
        country: 'NG',
        customer: phoneNumber,
        amount,
        type: itemCode,
        reference,
        biller_name: billerCode
      };

      const response = await axios.post<BillPaymentResponse>(
        `${this.baseUrl}/bills`,
        requestData,
        { headers: this.getHeaders() }
      );

      console.log('[Flutterwave Bills] Response:', response.data);

      if (response.data.status === 'success') {
        return {
          success: true,
          message: 'Data purchase successful',
          data: response.data.data
        };
      }

      return {
        success: false,
        message: response.data.message || 'Data purchase failed'
      };
    } catch (error: any) {
      console.error('[Flutterwave Bills] Data purchase failed:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to purchase data'
      };
    }
  }

  /**
   * Validate customer (phone number)
   */
  async validateCustomer(
    itemCode: string,
    billerCode: string,
    customer: string
  ): Promise<{ valid: boolean; customerName?: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/bill-items/${itemCode}/validate`,
        {
          code: billerCode,
          customer
        },
        { headers: this.getHeaders() }
      );

      if (response.data.status === 'success') {
        return {
          valid: true,
          customerName: response.data.data?.customer_name || 'Customer'
        };
      }

      return { valid: false };
    } catch (error) {
      console.error('Customer validation failed:', error);
      return { valid: false };
    }
  }

  /**
   * Get network biller code from network name
   */
  getNetworkBillerCode(network: string): string {
    const networkMap: { [key: string]: string } = {
      'MTN': 'BIL099',
      'GLO': 'BIL100', 
      'AIRTEL': 'BIL102',
      '9MOBILE': 'BIL103'
    };

    return networkMap[network.toUpperCase()] || 'BIL099';
  }
}

export const flutterwaveBillsService = new FlutterwaveBillsService();
