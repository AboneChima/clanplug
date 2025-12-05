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
   * Note: Flutterwave uses flexible amounts for data, not fixed plans
   * We'll return common data bundle amounts
   */
  async getDataBundles(network: string): Promise<BillCategory[]> {
    // Return common data bundle amounts for Nigerian networks
    const commonBundles = [
      { id: 'data-500mb', name: '500MB', amount: 200, validity: '30 days' },
      { id: 'data-1gb', name: '1GB', amount: 350, validity: '30 days' },
      { id: 'data-2gb', name: '2GB', amount: 700, validity: '30 days' },
      { id: 'data-3gb', name: '3GB', amount: 1000, validity: '30 days' },
      { id: 'data-5gb', name: '5GB', amount: 1500, validity: '30 days' },
      { id: 'data-10gb', name: '10GB', amount: 2500, validity: '30 days' },
      { id: 'data-15gb', name: '15GB', amount: 3500, validity: '30 days' },
      { id: 'data-20gb', name: '20GB', amount: 4500, validity: '30 days' },
    ];

    return commonBundles.map(bundle => ({
      id: bundle.id as any,
      biller_code: this.getNetworkBillerCode(network),
      name: bundle.name,
      amount: bundle.amount,
      validity: bundle.validity,
      item_code: bundle.id,
    } as any));
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
   * Using the VTU codes for Nigerian networks
   */
  getNetworkBillerCode(network: string): string {
    const networkMap: { [key: string]: string } = {
      'MTN': 'BIL099',      // MTN VTU
      'GLO': 'BIL102',      // GLO VTU  
      'AIRTEL': 'BIL100',   // AIRTEL VTU
      '9MOBILE': 'BIL103'   // 9MOBILE VTU
    };

    return networkMap[network.toUpperCase()] || 'BIL099';
  }
}

export const flutterwaveBillsService = new FlutterwaveBillsService();
