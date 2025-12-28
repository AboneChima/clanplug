'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  VTUService, 
  DataPlan, 
  VTUTransaction,
  AirtimeRequest,
  DataRequest
} from '@/services/vtu.service';
import {
  IoCallOutline,
  IoWifiOutline,
  IoCheckmarkCircle,
  IoFlashOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';

// Network prefix mapping for auto-detection
const NETWORK_PREFIXES: Record<string, string[]> = {
  'MTN': ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913'],
  'AIRTEL': ['0802', '0808', '0708', '0812', '0701', '0902', '0907', '0901', '0904', '0912'],
  'GLO': ['0805', '0807', '0705', '0815', '0811', '0905', '0915'],
  '9MOBILE': ['0809', '0817', '0818', '0909', '0908']
};

// Network branding with logo URLs
const NETWORK_BRANDS: Record<string, { color: string; logo: string }> = {
  'MTN': { 
    color: '#FFCC00', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/MTN_Logo.svg/200px-MTN_Logo.svg.png'
  },
  'AIRTEL': { 
    color: '#E60012', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Airtel_logo.svg/200px-Airtel_logo.svg.png'
  },
  'GLO': { 
    color: '#00A651', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Glo_logo.svg/200px-Glo_logo.svg.png'
  },
  '9MOBILE': { 
    color: '#00A86B', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/9mobile_logo.svg/200px-9mobile_logo.svg.png'
  }
};

const VTUServices: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State for active service selection
  const [activeService, setActiveService] = useState<'airtime' | 'data'>('airtime');
  
  // State for plans and transactions
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [transactions, setTransactions] = useState<VTUTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Form states
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [detectedNetwork, setDetectedNetwork] = useState<string>('');
  const [networkError, setNetworkError] = useState<string>('');

  // Quick amount options for airtime
  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  // Auto-detect network from phone number (debounced)
  useEffect(() => {
    const detectNetwork = () => {
      // Clear previous state
      setNetworkError('');
      setDetectedNetwork('');
      
      // Clean phone number
      const cleaned = phoneNumber.replace(/\D/g, '');
      
      // Need at least 4 digits to detect
      if (cleaned.length < 4) {
        return;
      }
      
      // Check if valid Nigerian number length
      if (cleaned.length > 4 && cleaned.length !== 11) {
        setNetworkError('Invalid phone number length');
        return;
      }
      
      const prefix = cleaned.substring(0, 4);
      
      // Find matching network
      for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
        if (prefixes.includes(prefix)) {
          setDetectedNetwork(network);
          return;
        }
      }
      
      // No network found
      if (cleaned.length >= 4) {
        setNetworkError('Unable to detect network');
      }
    };

    // Debounce detection
    const timer = setTimeout(detectNetwork, 300);
    return () => clearTimeout(timer);
  }, [phoneNumber]);

  // Auto-load data plans when network is detected
  useEffect(() => {
    if (detectedNetwork && activeService === 'data') {
      loadDataPlans(detectedNetwork);
    } else {
      setDataPlans([]);
      setSelectedPlan('');
    }
  }, [detectedNetwork, activeService]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadDataPlans = async (network: string) => {
    setLoadingPlans(true);
    try {
      // Mock data plans - replace with actual API call
      const mockPlans: DataPlan[] = [
        { id: '1', name: '500MB', amount: 200, validity: '7 days', network },
        { id: '2', name: '1GB', amount: 350, validity: '30 days', network },
        { id: '3', name: '2GB', amount: 700, validity: '30 days', network },
        { id: '4', name: '3GB', amount: 1050, validity: '30 days', network },
        { id: '5', name: '5GB', amount: 1500, validity: '30 days', network },
        { id: '6', name: '10GB', amount: 3000, validity: '30 days', network },
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setDataPlans(mockPlans);
    } catch (error) {
      showToast('Failed to load data plans', 'error');
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const response = await VTUService.getTransactions();
      if (response.success) {
        setTransactions(response.data?.transactions || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setAmount('');
    setSelectedPlan('');
    setDetectedNetwork('');
    setNetworkError('');
  };

  const handlePurchaseAirtime = async () => {
    if (!detectedNetwork || !phoneNumber || !amount) {
      showToast('Please enter phone number and amount', 'error');
      return;
    }

    try {
      setLoading(true);
      const request: AirtimeRequest = {
        network: detectedNetwork,
        phoneNumber,
        amount: parseFloat(amount),
      };

      const response = await VTUService.purchaseAirtime(request);
      
      // Check if response indicates success
      if (response.success || response.data?.reference) {
        showToast(response.message || 'Airtime purchase successful! ✅', 'success');
        resetForm();
        loadTransactions();
      } else {
        // Even if success is false, check if there's a reference (means it went through)
        if (response.data?.providerReference) {
          showToast('Airtime sent successfully! ✅', 'success');
          resetForm();
          loadTransactions();
        } else {
          showToast(response.message || 'Airtime purchase failed', 'error');
        }
      }
    } catch (error: any) {
      console.error('Airtime purchase error:', error);
      
      // Better error handling
      let errorMessage = 'Failed to purchase airtime';
      
      if (error.response) {
        // Server responded with error
        const serverMessage = error.response.data?.message || error.response.data?.error;
        if (serverMessage) {
          errorMessage = serverMessage;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request. Please check your details.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseData = async () => {
    if (!detectedNetwork || !phoneNumber || !selectedPlan) {
      showToast('Please enter phone number and select a plan', 'error');
      return;
    }

    const plan = dataPlans.find(p => p.id === selectedPlan);
    if (!plan) {
      showToast('Please select a valid data plan', 'error');
      return;
    }

    try {
      setLoading(true);
      const request: DataRequest = {
        network: detectedNetwork,
        phoneNumber,
        planId: selectedPlan,
        amount: plan.amount,
      };

      const response = await VTUService.purchaseData(request);
      
      // Check if response indicates success
      if (response.success || response.data?.reference) {
        showToast(response.message || 'Data purchase successful! ✅', 'success');
        resetForm();
        loadTransactions();
      } else {
        // Even if success is false, check if there's a reference (means it went through)
        if (response.data?.providerReference) {
          showToast('Data sent successfully! ✅', 'success');
          resetForm();
          loadTransactions();
        } else {
          showToast(response.message || 'Data purchase failed', 'error');
        }
      }
    } catch (error: any) {
      console.error('Data purchase error:', error);
      
      // Better error handling
      let errorMessage = 'Failed to purchase data';
      
      if (error.response) {
        // Server responded with error
        const serverMessage = error.response.data?.message || error.response.data?.error;
        if (serverMessage) {
          errorMessage = serverMessage;
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request. Please check your details.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    // Limit to 11 digits
    return cleaned.slice(0, 11);
  };

  return (
    <div className="max-w-2xl mx-auto max-[360px]:space-y-2 space-y-3 pb-6">
      {/* Service Selection Tabs - Dark Theme */}
      <div className="bg-slate-800 rounded-xl max-[360px]:p-0.5 p-1 border border-slate-700 shadow-lg">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => {
              setActiveService('airtime');
              setSelectedPlan('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              activeService === 'airtime'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <IoCallOutline className="w-5 h-5" />
            Airtime
          </button>
          <button
            onClick={() => {
              setActiveService('data');
              setAmount('');
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
              activeService === 'data'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <IoWifiOutline className="w-5 h-5" />
            Data
          </button>
        </div>
      </div>

      {/* Phone Number Input with Auto-Detection - Dark Theme */}
      <div className="bg-slate-800 rounded-xl max-[360px]:p-2.5 p-4 border border-slate-700 shadow-lg">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Phone Number
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-gray-400 text-sm">🇳🇬 +234</span>
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
            placeholder="8012345678"
            maxLength={11}
            className={`w-full pl-24 pr-3 py-3.5 rounded-lg border-2 transition-colors text-white text-base placeholder-gray-500 bg-slate-700 ${
              networkError 
                ? 'border-red-500 focus:border-red-400 focus:ring-0' 
                : detectedNetwork
                ? 'border-green-500 focus:border-green-400 focus:ring-0'
                : 'border-slate-600 focus:border-blue-500 focus:ring-0'
            }`}
          />
          
          {/* Network Detection Badge with Logo */}
          {detectedNetwork && NETWORK_BRANDS[detectedNetwork] && (
            <div 
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md shadow-lg animate-fade-in flex items-center gap-1.5 bg-slate-900 border border-slate-600"
            >
              <img 
                src={NETWORK_BRANDS[detectedNetwork].logo} 
                alt={detectedNetwork}
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-xs font-bold text-white">{detectedNetwork}</span>
            </div>
          )}
        </div>
        
        {/* Status Messages */}
        {networkError && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
            <IoAlertCircleOutline className="w-4 h-4" />
            <span>{networkError}</span>
          </div>
        )}
        {detectedNetwork && !networkError && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
            <IoCheckmarkCircle className="w-4 h-4" />
            <span>{detectedNetwork} network detected</span>
          </div>
        )}
      </div>

      {/* Airtime Amounts - Dark Theme - Extra Small Optimized */}
      {activeService === 'airtime' && detectedNetwork && (
        <div className="bg-slate-800 rounded-lg xs:rounded-xl p-2 xs:p-2.5 sm:p-3 md:p-4 border border-slate-700 shadow-lg space-y-1.5 xs:space-y-2 sm:space-y-3 animate-fade-in">
          <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300">
            Select Amount
          </label>
          <div className="grid grid-cols-3 gap-1 xs:gap-1.5 sm:gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className={`py-1.5 xs:py-2 sm:py-2.5 md:py-3 px-2 xs:px-2.5 sm:px-3 md:px-4 rounded-md xs:rounded-lg border border-2 font-semibold text-[10px] xs:text-xs sm:text-sm transition-all ${
                  amount === quickAmount.toString()
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700 text-gray-300'
                }`}
              >
                ₦{quickAmount}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Custom amount"
            min="50"
            max="10000"
            className="w-full px-2 xs:px-2.5 sm:px-3 md:px-4 py-2 xs:py-2.5 sm:py-3 md:py-3.5 rounded-md xs:rounded-lg border border-2 border-slate-600 focus:border-blue-500 focus:ring-0 text-white text-xs xs:text-sm sm:text-base placeholder-gray-500 transition-colors bg-slate-700"
          />
        </div>
      )}

      {/* Data Plans - Dark Theme - Extra Small Optimized */}
      {activeService === 'data' && detectedNetwork && (
        <div className="bg-slate-800 rounded-lg xs:rounded-xl p-2 xs:p-2.5 sm:p-3 md:p-4 border border-slate-700 shadow-lg space-y-1.5 xs:space-y-2 sm:space-y-3 animate-fade-in">
          <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300">
            Choose Data Plan
          </label>
          
          {loadingPlans ? (
            <div className="space-y-1.5 xs:space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 xs:h-14 sm:h-16 bg-slate-700 rounded-md xs:rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 xs:gap-1.5 sm:gap-2">
              {dataPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-md xs:rounded-lg border border-2 text-center transition-all ${
                    selectedPlan === plan.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <p className="font-bold text-white text-[11px] xs:text-xs sm:text-sm md:text-base">{plan.name}</p>
                    <p className="text-[8px] xs:text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{plan.validity}</p>
                    <p className="font-bold text-blue-400 text-[10px] xs:text-xs sm:text-sm mt-0.5 xs:mt-1">₦{plan.amount}</p>
                  </div>
                  {selectedPlan === plan.id && (
                    <IoCheckmarkCircle className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-400 absolute top-0.5 right-0.5 xs:top-1 xs:right-1 sm:top-1.5 sm:right-1.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buy Button - Dark Theme - Extra Small Optimized */}
      {detectedNetwork && ((activeService === 'airtime' && amount) || (activeService === 'data' && selectedPlan)) && (
        <button
          onClick={activeService === 'airtime' ? handlePurchaseAirtime : handlePurchaseData}
          disabled={loading || !detectedNetwork || !phoneNumber}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 xs:py-2.5 sm:py-3 md:py-4 px-3 xs:px-4 sm:px-5 md:px-6 rounded-lg xs:rounded-xl font-semibold text-xs xs:text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 xs:gap-2 shadow-lg animate-fade-in"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-1.5 xs:gap-2">
              <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <>
              <IoFlashOutline className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              <span>
                {activeService === 'airtime' 
                  ? `Buy - ₦${amount}` 
                  : `Buy - ₦${dataPlans.find(p => p.id === selectedPlan)?.amount}`
                }
              </span>
            </>
          )}
        </button>
      )}

      {/* Recent Transactions - Dark Theme */}
      {transactions.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-3">Recent Transactions</h3>
          <div className="space-y-2">
            {transactions.slice(0, 3).map((transaction) => {
              const TransactionIcon = transaction.type === 'DATA' ? IoWifiOutline : IoCallOutline;
              return (
                <div key={transaction.id} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <TransactionIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{transaction.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-white text-sm">₦{transaction.amount}</p>
                    <p className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      transaction.status === 'COMPLETED' 
                        ? 'bg-green-500/20 text-green-400' 
                        : transaction.status === 'PENDING'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VTUServices;
