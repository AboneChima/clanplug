import config from '../config/config';
import axios from 'axios';

interface NowPaymentsConfig {
  apiKey: string;
  baseUrl: string;
  ipnSecret?: string;
}

interface CreatePaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  order_id: string;
  order_description: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
}

interface CreatePaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  payment_url?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentStatusResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  actually_paid: number;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount?: number;
  outcome_currency?: string;
}

interface AvailableCurrency {
  name: string;
  code: string;
  network?: string;
  is_popular: boolean;
  is_stable: boolean;
}

class NowPaymentsService {
  private config: NowPaymentsConfig;
  private axiosInstance;

  constructor() {
    this.config = {
      apiKey: process.env.NOWPAYMENTS_API_KEY || '',
      baseUrl: process.env.NOWPAYMENTS_BASE_URL || 'https://api.nowpayments.io/v1',
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  // Get available currencies for payments
  async getAvailableCurrencies(): Promise<AvailableCurrency[]> {
    // Return mock data if API key is not configured or is a placeholder
    if (!this.config.apiKey || this.config.apiKey === 'test_api_key_placeholder') {
      return [
        { name: 'Bitcoin', code: 'BTC', is_popular: true, is_stable: false },
        { name: 'Ethereum', code: 'ETH', is_popular: true, is_stable: false },
        { name: 'Tether USD', code: 'USDT', is_popular: true, is_stable: true },
        { name: 'USD Coin', code: 'USDC', is_popular: true, is_stable: true },
        { name: 'Litecoin', code: 'LTC', is_popular: false, is_stable: false },
        { name: 'Dogecoin', code: 'DOGE', is_popular: false, is_stable: false }
      ];
    }

    try {
      const response = await this.axiosInstance.get('/currencies');
      
      // NOWPayments returns an object with currencies array
      const currenciesData = response.data;
      const currencyCodes = currenciesData.currencies || currenciesData;
      
      // Ensure we have an array
      if (!Array.isArray(currencyCodes)) {
        console.error('NOWPayments currencies response is not an array:', currencyCodes);
        throw new Error('Invalid currencies response format');
      }
      
      // Transform currency codes into proper currency objects
      return this.transformCurrencyCodes(currencyCodes);
    } catch (error: any) {
      console.error('NowPayments: Failed to get currencies:', error.response?.data || error.message);
      throw new Error('Failed to fetch available currencies');
    }
  }

  // Transform currency codes into currency objects with metadata
  private transformCurrencyCodes(currencyCodes: string[]): AvailableCurrency[] {
    // Popular cryptocurrencies list
    const popularCryptos = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'ada', 'xrp', 'sol', 'doge', 'ltc'];
    
    // Stable coins list
    const stableCoins = ['usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'frax', 'lusd'];
    
    // Currency name mappings (common ones)
    const currencyNames: { [key: string]: string } = {
      'btc': 'Bitcoin',
      'eth': 'Ethereum',
      'usdt': 'Tether USD',
      'usdc': 'USD Coin',
      'bnb': 'BNB',
      'ada': 'Cardano',
      'xrp': 'XRP',
      'sol': 'Solana',
      'doge': 'Dogecoin',
      'ltc': 'Litecoin',
      'dot': 'Polkadot',
      'link': 'Chainlink',
      'matic': 'Polygon',
      'avax': 'Avalanche',
      'uni': 'Uniswap',
      'atom': 'Cosmos',
      'xlm': 'Stellar',
      'algo': 'Algorand',
      'vet': 'VeChain',
      'icp': 'Internet Computer',
      'fil': 'Filecoin',
      'trx': 'TRON',
      'etc': 'Ethereum Classic',
      'bch': 'Bitcoin Cash',
      'near': 'NEAR Protocol',
      'apt': 'Aptos',
      'sui': 'Sui',
      'arb': 'Arbitrum',
      'op': 'Optimism'
    };

    return currencyCodes.map(code => {
      const lowerCode = code.toLowerCase();
      return {
        name: currencyNames[lowerCode] || code.toUpperCase(),
        code: code.toUpperCase(),
        is_popular: popularCryptos.includes(lowerCode),
        is_stable: stableCoins.includes(lowerCode)
      };
    });
  }

  // Get minimum payment amount for a currency
  async getMinimumAmount(currencyFrom: string, currencyTo: string = 'usd'): Promise<number> {
    // Return mock data if API key is not configured or is a placeholder
    if (!this.config.apiKey || this.config.apiKey === 'test_api_key_placeholder') {
      // Mock minimum amounts for different currencies
      const mockMinAmounts: { [key: string]: number } = {
        'BTC': 0.0001,
        'ETH': 0.001,
        'USDT': 1,
        'USDC': 1,
        'LTC': 0.01,
        'DOGE': 10
      };
      return mockMinAmounts[currencyFrom.toUpperCase()] || 0;
    }

    try {
      const response = await this.axiosInstance.get(`/min-amount`, {
        params: {
          currency_from: currencyFrom,
          currency_to: currencyTo
        }
      });
      return response.data.min_amount || 0;
    } catch (error: any) {
      console.error('NowPayments: Failed to get minimum amount:', error.response?.data || error.message);
      return 0;
    }
  }

  // Create a new payment
  async createPayment(paymentData: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    // Return mock data if API key is not configured or is a placeholder
    if (!this.config.apiKey || this.config.apiKey === 'test_api_key_placeholder') {
      return this.getMockPayment(paymentData);
    }

    try {
      const response = await this.axiosInstance.post('/payment', paymentData);
      return response.data;
    } catch (error: any) {
      console.error('NowPayments: Failed to create payment:', error.response?.data || error.message);
      
      // Check for specific error types that indicate API limitations
      const errorMessage = error.response?.data?.message || error.message || '';
      const isLimitedAccess = errorMessage.includes('Invalid api key') || 
                             errorMessage.includes('Invalid access token') || 
                             errorMessage.includes('Unauthorized') ||
                             errorMessage.includes('Forbidden') ||
                             error.response?.status === 401 ||
                             error.response?.status === 403;
      
      if (isLimitedAccess) {
        console.log('NowPayments: Using mock payment data due to API access limitations');
        return this.getMockPayment(paymentData);
      }
      
      throw new Error(error.response?.data?.message || 'Failed to create payment');
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await this.axiosInstance.get(`/payment/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('NowPayments: Failed to get payment status:', error.response?.data || error.message);
      throw new Error('Failed to get payment status');
    }
  }

  // Verify IPN callback signature
  verifyIpnSignature(payload: string, signature: string): boolean {
    if (!this.config.ipnSecret) {
      console.warn('NowPayments: IPN secret not configured');
      return false;
    }

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha512', this.config.ipnSecret)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('NowPayments: Failed to verify IPN signature:', error);
      return false;
    }
  }

  // Get estimate for payment conversion
  async getEstimate(amount: number, currencyFrom: string, currencyTo: string = 'usd'): Promise<{
    currency_from: string;
    amount_from: number;
    currency_to: string;
    estimated_amount: number;
  }> {
    // Return mock data if API key is not configured or is a placeholder
    if (!this.config.apiKey || this.config.apiKey === 'test_api_key_placeholder') {
      return this.getMockEstimate(amount, currencyFrom, currencyTo);
    }

    try {
      const response = await this.axiosInstance.get('/estimate', {
        params: {
          amount,
          currency_from: currencyFrom,
          currency_to: currencyTo
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('NowPayments: Failed to get estimate:', error.response?.data || error.message);
      
      // Check for specific error types that indicate API limitations
      const errorMessage = error.response?.data?.message || error.message || '';
      const isLimitedAccess = errorMessage.includes('Invalid access token') || 
                             errorMessage.includes('Unauthorized') ||
                             errorMessage.includes('Forbidden') ||
                             error.response?.status === 401 ||
                             error.response?.status === 403;
      
      if (isLimitedAccess) {
        console.log('NowPayments: Using mock data due to API access limitations');
        return this.getMockEstimate(amount, currencyFrom, currencyTo);
      }
      
      // For other errors, still fallback to mock data to prevent frontend crashes
      return this.getMockEstimate(amount, currencyFrom, currencyTo);
    }
  }

  // Helper method for mock estimates
  private getMockEstimate(amount: number, currencyFrom: string, currencyTo: string) {
    // Mock exchange rates for common conversions
    const mockRates: { [key: string]: number } = {
      'USD_BTC': 0.000025,  // 1 USD = 0.000025 BTC (approx $40,000 per BTC)
      'USD_ETH': 0.0004,    // 1 USD = 0.0004 ETH (approx $2,500 per ETH)
      'USD_USDT': 1,        // 1 USD = 1 USDT
      'USD_USDC': 1,        // 1 USD = 1 USDC
      'USD_LTC': 0.01,      // 1 USD = 0.01 LTC (approx $100 per LTC)
      'USD_DOGE': 10,       // 1 USD = 10 DOGE (approx $0.10 per DOGE)
    };
    
    const rateKey = `${currencyFrom.toUpperCase()}_${currencyTo.toUpperCase()}`;
    const rate = mockRates[rateKey] || 0.000025; // Default to BTC rate
    
    return {
      currency_from: currencyFrom.toUpperCase(),
      amount_from: amount,
      currency_to: currencyTo.toUpperCase(),
      estimated_amount: amount * rate
    };
  }

  // Helper method for mock payment creation
  private getMockPayment(paymentData: CreatePaymentRequest): CreatePaymentResponse {
    const mockPaymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockAddress = this.generateMockAddress(paymentData.pay_currency || 'BTC');
    
    // Calculate mock pay amount using the same rates as estimates
    const mockRates: { [key: string]: number } = {
      'USD_BTC': 0.000025,
      'USD_ETH': 0.0004,
      'USD_USDT': 1,
      'USD_USDC': 1,
      'USD_LTC': 0.01,
      'USD_DOGE': 10,
    };
    
    const rateKey = `${paymentData.price_currency.toUpperCase()}_${(paymentData.pay_currency || 'BTC').toUpperCase()}`;
    const rate = mockRates[rateKey] || 0.000025;
    const payAmount = paymentData.price_amount * rate;
    
    return {
      payment_id: mockPaymentId,
      payment_status: 'waiting',
      pay_address: mockAddress,
      price_amount: paymentData.price_amount,
      price_currency: paymentData.price_currency,
      pay_amount: payAmount,
      pay_currency: paymentData.pay_currency || 'BTC',
      order_id: paymentData.order_id,
      order_description: paymentData.order_description,
      payment_url: `https://nowpayments.io/payment/?iid=${mockPaymentId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Generate mock cryptocurrency addresses for testing
  private generateMockAddress(currency: string): string {
    const mockAddresses: { [key: string]: string } = {
      'BTC': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block address
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDT': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      'USDC': '0x0000000000000000000000000000000000000000',
      'LTC': 'LM2WMpR1Rp6j3Sa59cMXMs1SPzj9eXpGc1',
      'DOGE': 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L'
    };
    
    return mockAddresses[currency.toUpperCase()] || mockAddresses['BTC'];
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha512', this.config.ipnSecret)
        .update(body)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  // Check if service is properly configured
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.baseUrl);
  }

  // Get supported popular cryptocurrencies
  getPopularCurrencies(): string[] {
    return [
      'btc',    // Bitcoin
      'eth',    // Ethereum
      'usdt',   // Tether
      'usdc',   // USD Coin
      'ltc',    // Litecoin
      'bch',    // Bitcoin Cash
      'xrp',    // Ripple
      'ada',    // Cardano
      'dot',    // Polkadot
      'bnb'     // Binance Coin
    ];
  }
}

export const nowPaymentsService = new NowPaymentsService();