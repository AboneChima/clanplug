export interface NigerianBank {
  name: string;
  code: string;
  slug?: string;
  id?: number;
}

// Cache for banks to avoid repeated API calls
let cachedBanks: NigerianBank[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback banks in case API fails
const FALLBACK_BANKS: NigerianBank[] = [
  { name: "Access Bank", code: "044", slug: "access-bank" },
  { name: "First Bank of Nigeria", code: "011", slug: "first-bank-of-nigeria" },
  { name: "Guaranty Trust Bank", code: "058", slug: "guaranty-trust-bank" },
  { name: "United Bank For Africa", code: "033", slug: "united-bank-for-africa" },
  { name: "Zenith Bank", code: "057", slug: "zenith-bank" },
  { name: "Fidelity Bank", code: "070", slug: "fidelity-bank" },
  { name: "Union Bank of Nigeria", code: "032", slug: "union-bank-of-nigeria" },
  { name: "Sterling Bank", code: "232", slug: "sterling-bank" },
  { name: "Stanbic IBTC Bank", code: "221", slug: "stanbic-ibtc-bank" },
  { name: "Wema Bank", code: "035", slug: "wema-bank" },
  { name: "Kuda Bank", code: "50211", slug: "kuda-bank" },
  { name: "Opay", code: "100004", slug: "opay" },
  { name: "PalmPay", code: "999991", slug: "palmpay" },
  { name: "Moniepoint", code: "50515", slug: "moniepoint" }
];

/**
 * Get banks from Flutterwave API with caching and fallback
 */
export const getNigerianBanks = async (): Promise<NigerianBank[]> => {
  try {
    // Check cache first
    if (cachedBanks && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return cachedBanks;
    }

    // Get API base URL
    const getApiBaseUrl = () => {
      if (typeof window !== 'undefined') {
        const currentHost = window.location.host;
        const currentProtocol = window.location.protocol;
        
        if (!currentHost.includes('localhost') && !currentHost.includes('127.0.0.1')) {
          return `${currentProtocol}//${currentHost}`;
        }
      }
      
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    };

    const API_BASE_URL = getApiBaseUrl();

    // Fetch banks from backend API
    const response = await fetch(`${API_BASE_URL}/api/payments/banks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data) {
        // Transform Flutterwave bank format to our format
        const banks: NigerianBank[] = data.data.map((bank: any) => ({
          name: bank.name,
          code: bank.code,
          slug: bank.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          id: bank.id
        }));

        // Cache the results
        cachedBanks = banks;
        cacheTimestamp = Date.now();
        
        return banks;
      }
    }

    // If API fails, return fallback banks
    console.warn('Failed to fetch banks from API, using fallback list');
    return FALLBACK_BANKS;
  } catch (error) {
    console.error('Error fetching banks:', error);
    return FALLBACK_BANKS;
  }
};

export interface AccountNameResponse {
  success: boolean;
  accountName?: string;
  message?: string;
}

export const resolveAccountName = async (
  accountNumber: string, 
  bankCode: string
): Promise<AccountNameResponse> => {
  try {
    // Validate input
    if (accountNumber.length < 8 || accountNumber.length > 15) {
      return {
        success: false,
        message: "Account number must be between 8 and 15 digits"
      };
    }

    // Use the backend API URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jobica-backend.onrender.com';

    // Call backend API to resolve account name via Flutterwave
    const response = await fetch(`${API_BASE_URL}/api/withdrawal/verify-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountNumber,
        bankCode
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        accountName: data.data.accountName // Fix: access accountName from data.data
      };
    } else {
      return {
        success: false,
        message: data.message || "Failed to verify account"
      };
    }
  } catch (error) {
    console.error('Account verification error:', error);
    return {
      success: false,
      message: "Network error. Please try again."
    };
  }
};

export const getBankByCode = async (code: string): Promise<NigerianBank | undefined> => {
  const banks = await getNigerianBanks();
  return banks.find(bank => bank.code === code);
};

export const getBankByName = async (name: string): Promise<NigerianBank | undefined> => {
  const banks = await getNigerianBanks();
  return banks.find(bank => 
    bank.name.toLowerCase() === name.toLowerCase()
  );
};