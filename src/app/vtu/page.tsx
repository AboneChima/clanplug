'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { VTUService } from '@/services/vtu.service';
import AppShell from '@/components/AppShell';
import { useVisibilityRefresh } from '@/hooks/usePageVisibility';
import { IoPhonePortraitOutline } from 'react-icons/io5';

// Interfaces
interface NigerianProvider {
  id: string;
  name: string;
  code: string;
  color: string;
  logo: string;
  dataPlans: DataPlan[];
}

interface DataPlan {
  id: string;
  name: string;
  price: number;
  data: string;
  validity: string;
}

type ServiceType = 'airtime' | 'data';

interface Transaction {
  id: string;
  type: string;
  provider: string;
  recipient: string;
  amount: number;
  status: string;
  createdAt: string;
}

const VTUPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State management
  const [activeService, setActiveService] = useState<ServiceType>('airtime');
  const [selectedProvider, setSelectedProvider] = useState<NigerianProvider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDataPlan, setSelectedDataPlan] = useState<DataPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Nigerian providers data
  const nigerianProviders: NigerianProvider[] = [
    {
      id: 'mtn',
      name: 'MTN',
      code: 'MTN',
      color: '#FFCC00',
      logo: '/mtn.jpeg',
      dataPlans: [
        { id: '1', name: '1GB - 30 Days', price: 350, data: '1GB', validity: '30 days' },
        { id: '2', name: '2GB - 30 Days', price: 700, data: '2GB', validity: '30 days' },
        { id: '3', name: '5GB - 30 Days', price: 1500, data: '5GB', validity: '30 days' },
      ]
    },
    {
      id: 'glo',
      name: 'Glo',
      code: 'GLO',
      color: '#00A651',
      logo: '/glo.jpeg',
      dataPlans: [
        { id: '4', name: '1GB - 30 Days', price: 300, data: '1GB', validity: '30 days' },
        { id: '5', name: '2GB - 30 Days', price: 600, data: '2GB', validity: '30 days' },
        { id: '6', name: '5GB - 30 Days', price: 1400, data: '5GB', validity: '30 days' },
      ]
    },
    {
      id: 'airtel',
      name: 'Airtel',
      code: 'AIRTEL',
      color: '#FF0000',
      logo: '/airtel.jpeg',
      dataPlans: [
        { id: '7', name: '1GB - 30 Days', price: 370, data: '1GB', validity: '30 days' },
        { id: '8', name: '2GB - 30 Days', price: 740, data: '2GB', validity: '30 days' },
        { id: '9', name: '5GB - 30 Days', price: 1600, data: '5GB', validity: '30 days' },
      ]
    },
    {
      id: '9mobile',
      name: '9mobile',
      code: '9MOBILE',
      color: '#00A86B',
      logo: '/9mobile.jpeg',
      dataPlans: [
        { id: '10', name: '1GB - 30 Days', price: 400, data: '1GB', validity: '30 days' },
        { id: '11', name: '2GB - 30 Days', price: 800, data: '2GB', validity: '30 days' },
        { id: '12', name: '5GB - 30 Days', price: 1700, data: '5GB', validity: '30 days' },
      ]
    }
  ];

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  // Load transactions
  const loadTransactions = async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      const response = await VTUService.getTransactions();
      setTransactions(response.data?.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Use visibility refresh hook to handle tab switching
  const { isVisible } = useVisibilityRefresh(loadTransactions, [user], {
    refreshOnVisible: true,
    refreshDelay: 1000,
    enabled: !!user
  });

  // Handle case when there's no user
  useEffect(() => {
    if (!user) {
      setLoadingTransactions(false);
      setTransactions([]);
    }
  }, [user]);

  // Handle airtime purchase
  const handleAirtimePurchase = async () => {
    if (!selectedProvider || !phoneNumber || !amount) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await VTUService.purchaseAirtime({
        network: selectedProvider.code,
        phoneNumber,
        amount: parseFloat(amount)
      });
      showToast('Airtime purchase successful!', 'success');
      setPhoneNumber('');
      setAmount('');
      loadTransactions();
    } catch (error: any) {
      showToast(error.message || 'Purchase failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle data purchase
  const handleDataPurchase = async () => {
    if (!selectedProvider || !phoneNumber || !selectedDataPlan) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await VTUService.purchaseData({
        network: selectedProvider.code,
        phoneNumber,
        planId: selectedDataPlan.id,
        amount: selectedDataPlan.price
      });
      showToast('Data purchase successful!', 'success');
      setPhoneNumber('');
      setSelectedDataPlan(null);
      loadTransactions();
    } catch (error: any) {
      showToast(error.message || 'Purchase failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 sm:p-8 rounded-xl sm:rounded-2xl max-w-md w-full">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Authentication Required</h2>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">Please log in to access Airtime & Data services</p>
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-medium transition-all">
                Log In
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-40 lg:pb-8">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-4">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-white mb-1">Airtime & Data</h1>
                <p className="text-xs sm:text-base text-white/90">Buy airtime and data</p>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-green-800 bg-green-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-green-200 flex-shrink-0 w-fit">
                <IoPhonePortraitOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Instant Delivery</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Service Selection */}
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700 mb-4 sm:mb-6">
                <div className="p-4 sm:p-6 border-b border-slate-700">
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Select Service</h2>
                  <div className="flex gap-2 sm:gap-4">
                    <button
                      onClick={() => {
                        setActiveService('airtime');
                        setSelectedDataPlan(null);
                      }}
                      className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                        activeService === 'airtime'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      Airtime
                    </button>
                    <button
                      onClick={() => {
                        setActiveService('data');
                        setAmount('');
                      }}
                      className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                        activeService === 'data'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      Data
                    </button>
                  </div>
                </div>

                {/* Provider Selection */}
                <div className="p-4 sm:p-6 border-b border-slate-700">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Choose Network</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    {nigerianProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider)}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                          selectedProvider?.id === provider.id
                            ? 'border-blue-600 bg-blue-600/20'
                            : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                        }`}
                      >
                        <img
                          src={provider.logo}
                          alt={provider.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded object-cover"
                        />
                        <p className="text-xs sm:text-sm font-medium text-white">{provider.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Content */}
                {selectedProvider && (
                  <div className="p-4 sm:p-6">
                    {/* Phone Number Input */}
                    <div className="mb-4 sm:mb-6">
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-600 bg-slate-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                      />
                    </div>

                    {/* Airtime Amount Selection */}
                    {activeService === 'airtime' && (
                      <div className="mb-4 sm:mb-6">
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                          Amount
                        </label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                          {quickAmounts.map((quickAmount) => (
                            <button
                              key={quickAmount}
                              onClick={() => setAmount(quickAmount.toString())}
                              className={`py-2 px-2 sm:px-3 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                                amount === quickAmount.toString()
                                  ? 'border-blue-600 bg-blue-600/20 text-blue-400'
                                  : 'border-slate-600 bg-slate-700 text-gray-300 hover:bg-slate-600'
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
                          placeholder="Enter custom amount"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-600 bg-slate-700 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                        />
                      </div>
                    )}

                    {/* Data Plan Selection */}
                    {activeService === 'data' && (
                      <div className="mb-4 sm:mb-6">
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                          Data Plan
                        </label>
                        <div className="space-y-2 sm:space-y-3">
                          {selectedProvider.dataPlans.map((plan) => (
                            <button
                              key={plan.id}
                              onClick={() => setSelectedDataPlan(plan)}
                              className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${
                                selectedDataPlan?.id === plan.id
                                  ? 'border-blue-600 bg-blue-600/20'
                                  : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm sm:text-base font-medium text-white">{plan.data}</p>
                                  <p className="text-xs sm:text-sm text-gray-400">{plan.validity}</p>
                                </div>
                                <p className="text-sm sm:text-base font-bold text-white">₦{plan.price}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={activeService === 'airtime' ? handleAirtimePurchase : handleDataPurchase}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        `Purchase ${activeService === 'airtime' ? 'Airtime' : 'Data'}`
                      )}
                    </button>
                  </div>
                )}

                {!selectedProvider && (
                  <div className="p-6 sm:p-8 text-center">
                    <p className="text-sm sm:text-base text-gray-400">Please select a network provider to continue</p>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700">
                <div className="p-4 sm:p-6 border-b border-slate-700">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Recent Transactions</h3>
                </div>
                
                <div className="p-4 sm:p-6">
                  {loadingTransactions ? (
                    <div className="text-center py-6 sm:py-8">
                      <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-3 sm:mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm sm:text-base text-gray-400">Loading...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-sm sm:text-base text-gray-400">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {transactions.slice(0, 5).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-3 sm:p-4 border border-slate-600 bg-slate-700/50 rounded-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-sm sm:text-base font-medium text-white capitalize">
                                {transaction.type}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-400">
                                {transaction.recipient}
                              </p>
                            </div>
                            <p className="text-sm sm:text-base font-bold text-white">
                              ₦{transaction.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default VTUPage;