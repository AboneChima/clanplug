'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  VTUService, 
  VTUProvider, 
  DataPlan, 
  VTUTransaction,
  AirtimeRequest,
  DataRequest
} from '@/services/vtu.service';
import {
  IoCallOutline,
  IoWifiOutline,
  IoTimeOutline,
  IoPhonePortraitOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';

interface Provider {
  id: string;
  name: string;
  code: string;
  logo?: string;
  color?: string;
}

const VTUServices: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // State for active service selection
  const [activeService, setActiveService] = useState<'airtime' | 'data'>('airtime');
  
  // State for providers and plans
  const [providers, setProviders] = useState<Provider[]>([]);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [transactions, setTransactions] = useState<VTUTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Form states
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  // Quick amount options for airtime
  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    loadProviders();
    loadTransactions();
  }, []);

  useEffect(() => {
    if (selectedProvider && activeService === 'data') {
      loadDataPlans(selectedProvider);
    }
  }, [selectedProvider, activeService]);

  const loadProviders = async () => {
    try {
      // Providers with logos and colors for better UI
      const mockProviders: Provider[] = [
        { id: '1', name: 'MTN', code: 'MTN', color: '#FFCC00', logo: '/providers/mtn.svg' },
        { id: '2', name: 'Airtel', code: 'AIRTEL', color: '#E60012', logo: '/providers/airtel.svg' },
        { id: '3', name: 'Glo', code: 'GLO', color: '#00A651', logo: '/providers/glo.svg' },
        { id: '4', name: '9mobile', code: '9MOBILE', color: '#00A86B', logo: '/providers/9mobile.svg' },
      ];
      setProviders(mockProviders);
    } catch (error) {
      showToast('Failed to load providers', 'error');
    }
  };

  const loadDataPlans = async (network: string) => {
    try {
      // Mock data plans
      const mockPlans: DataPlan[] = [
        { id: '1', name: '1GB - 30 Days', amount: 350, validity: '30 days', network: selectedProvider },
        { id: '2', name: '2GB - 30 Days', amount: 700, validity: '30 days', network: selectedProvider },
        { id: '3', name: '5GB - 30 Days', amount: 1500, validity: '30 days', network: selectedProvider },
        { id: '4', name: '10GB - 30 Days', amount: 3000, validity: '30 days', network: selectedProvider },
        { id: '5', name: '20GB - 30 Days', amount: 5000, validity: '30 days', network: selectedProvider },
      ];
      setDataPlans(mockPlans);
    } catch (error) {
      showToast('Failed to load data plans', 'error');
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
    setSelectedProvider('');
    setPhoneNumber('');
    setAmount('');
    setSelectedPlan('');
  };

  const handlePurchaseAirtime = async () => {
    if (!selectedProvider || !phoneNumber || !amount) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const request: AirtimeRequest = {
        network: selectedProvider,
        phoneNumber,
        amount: parseFloat(amount),
      };

      const response = await VTUService.purchaseAirtime(request);
      
      if (response.success) {
        showToast(response.message, 'success');
        resetForm();
        loadTransactions();
      } else {
        showToast(response.message, 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to purchase airtime', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseData = async () => {
    if (!selectedProvider || !phoneNumber || !selectedPlan) {
      showToast('Please fill all required fields', 'error');
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
        network: selectedProvider,
        phoneNumber,
        planId: selectedPlan,
        amount: plan.amount,
      };

      const response = await VTUService.purchaseData(request);
      
      if (response.success) {
        showToast(response.message, 'success');
        resetForm();
        loadTransactions();
      } else {
        showToast(response.message, 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to purchase data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'airtime': return IoCallOutline;
      case 'data': return IoWifiOutline;
      default: return IoCallOutline;
    }
  };

  const getServiceTitle = (service: string) => {
    switch (service) {
      case 'airtime': return 'Buy Airtime';
      case 'data': return 'Buy Data';
      default: return 'VTU Service';
    }
  };

  const ServiceIcon = getServiceIcon(activeService);

  return (
    <div className="space-y-6">
      {/* Service Selection Tabs */}
      <div className="bg-card rounded-2xl p-2 border border-border shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveService('airtime')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              activeService === 'airtime'
                ? 'bg-brand-gradient text-white shadow-lg'
                : 'text-muted-foreground hover:text-card-foreground hover:bg-surface'
            }`}
          >
            <IoCallOutline className="w-5 h-5" />
            Airtime
          </button>
          <button
            onClick={() => setActiveService('data')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
              activeService === 'data'
                ? 'bg-brand-gradient text-white shadow-lg'
                : 'text-muted-foreground hover:text-card-foreground hover:bg-surface'
            }`}
          >
            <IoWifiOutline className="w-5 h-5" />
            Data
          </button>
        </div>
      </div>

      {/* Service Header */}
      <div className="bg-gradient-to-r from-brand-50 to-brand-100 rounded-2xl p-6 border border-brand-200/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center">
            <ServiceIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">{getServiceTitle(activeService)}</h2>
            <p className="text-muted-foreground">Quick and secure {activeService} services</p>
          </div>
        </div>
      </div>

      {/* Service Form */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        {activeService === 'airtime' && (
          <div className="space-y-6">
            {/* Network Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-3">Select Network</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.code)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedProvider === provider.code
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-border hover:border-brand-300 bg-surface'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-gray-100 shadow-sm">
                        {provider.logo ? (
                          <img 
                            src={provider.logo} 
                            alt={provider.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <div 
                            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: provider.color }}
                          >
                            {provider.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-card-foreground">{provider.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Phone Number</label>
              <div className="relative">
                <IoPhonePortraitOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08012345678"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Quick Amount Selection */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-3">Select Amount</label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`py-3 px-4 rounded-xl border-2 font-semibold transition-all duration-200 ${
                      amount === quickAmount.toString()
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-border hover:border-brand-300 bg-surface text-card-foreground'
                    }`}
                  >
                    ₦{quickAmount}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-2">Or enter custom amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="50"
                  max="10000"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handlePurchaseAirtime}
              disabled={loading || !selectedProvider || !phoneNumber || !amount}
              className="w-full bg-brand-gradient text-white py-4 px-6 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <IoCheckmarkCircle className="w-5 h-5" />
                  Buy Airtime - ₦{amount || '0'}
                </>
              )}
            </button>
          </div>
        )}

        {activeService === 'data' && (
          <div className="space-y-6">
            {/* Network Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-3">Select Network</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.code)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedProvider === provider.code
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-border hover:border-brand-300 bg-surface'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center bg-gray-100 shadow-sm">
                        {provider.logo ? (
                          <img 
                            src={provider.logo} 
                            alt={provider.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <div 
                            className="w-full h-full rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: provider.color }}
                          >
                            {provider.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-card-foreground">{provider.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">Phone Number</label>
              <div className="relative">
                <IoPhonePortraitOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08012345678"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Data Plans */}
            {selectedProvider && (
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-3">Select Data Plan</label>
                <div className="space-y-3">
                  {dataPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        selectedPlan === plan.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-border hover:border-brand-300 bg-surface'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-card-foreground">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">{plan.validity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-600">₦{plan.amount}</p>
                          {selectedPlan === plan.id && (
                            <IoCheckmarkCircle className="w-5 h-5 text-brand-500 ml-auto mt-1" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handlePurchaseData}
              disabled={loading || !selectedProvider || !phoneNumber || !selectedPlan}
              className="w-full bg-brand-gradient text-white py-4 px-6 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <IoCheckmarkCircle className="w-5 h-5" />
                  Buy Data{selectedPlan && dataPlans.find(p => p.id === selectedPlan) ? ` - ₦${dataPlans.find(p => p.id === selectedPlan)?.amount}` : ''}
                </>
              )}
            </button>
          </div>
        )}


      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Recent Transactions</h3>
        {loadingTransactions ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-surface rounded-xl">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => {
              const TransactionIcon = transaction.type === 'DATA' ? IoWifiOutline : IoCallOutline;
              return (
                <div key={transaction.id} className="flex items-center gap-3 p-4 bg-surface rounded-xl hover:bg-surface-hover transition-colors">
                  <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center">
                    <TransactionIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-card-foreground">₦{transaction.amount}</p>
                    <p className={`text-xs px-3 py-1 rounded-full font-medium ${
                      transaction.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800' 
                        : transaction.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <IoTimeOutline className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VTUServices;