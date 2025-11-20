"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IoArrowBack, 
  IoWalletOutline, 
  IoCashOutline, 
  IoCardOutline, 
  IoPersonOutline, 
  IoDocumentTextOutline,
  IoChevronDown,
  IoCheckmarkCircle,
  IoWarningOutline,
  IoInformationCircleOutline
} from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth-api';
import { resolveAccountName, type NigerianBank } from '@/services/bankService';

interface WithdrawalLimits {
  daily: { limit: number; used: number; remaining: number };
  monthly: { limit: number; used: number; remaining: number };
  minimum: number;
  maximum: number;
  fee: { percentage: number; minimum: number };
}

interface FlutterwaveBank {
  id: number;
  code: string;
  name: string;
}

export default function WithdrawalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [accountResolved, setAccountResolved] = useState(false);
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);
  const [banks, setBanks] = useState<FlutterwaveBank[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceRes, limitsRes, banksRes] = await Promise.all([
        authApi.get('/api/wallets/balance'),
        authApi.get('/api/withdrawal/limits'),
        authApi.getBanks()
      ]);

      if (balanceRes.success) {
        setBalance(balanceRes.data?.NGN || 0);
      }
      if (limitsRes.success) {
        setLimits(limitsRes.data);
      }
      if (banksRes.success && banksRes.data) {
        setBanks(banksRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const calculateFees = (amount: number) => {
    if (!amount) return { fee: 0, netAmount: 0, totalDeduction: 0 };
    const fee = amount * 0.005;
    const netAmount = amount - fee;
    const totalDeduction = amount;
    return { fee, netAmount, totalDeduction };
  };

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.bank-dropdown-container')) {
        setShowBankDropdown(false);
      }
    };

    if (showBankDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBankDropdown]);

  useEffect(() => {
    const resolveAccount = async () => {
      if (formData.accountNumber.length === 10 && formData.bankCode) {
        setResolvingAccount(true);
        setAccountResolved(false);
        
        try {
          const response = await resolveAccountName(formData.accountNumber, formData.bankCode);
          if (response.success && response.accountName) {
            setFormData(prev => ({ ...prev, accountName: response.accountName! }));
            setAccountResolved(true);
            setError('');
          } else {
            setError(response.message || 'Could not verify account details');
            setFormData(prev => ({ ...prev, accountName: '' }));
          }
        } catch (error) {
          setError('Failed to verify account');
          setFormData(prev => ({ ...prev, accountName: '' }));
        } finally {
          setResolvingAccount(false);
        }
      } else {
        setAccountResolved(false);
        setFormData(prev => ({ ...prev, accountName: '' }));
      }
    };

    resolveAccount();
  }, [formData.accountNumber, formData.bankCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const amount = parseFloat(formData.amount);
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (limits) {
      if (amount < limits.minimum) {
        setError(`Minimum withdrawal: ₦${limits.minimum.toLocaleString()}`);
        return;
      }
      if (amount > limits.maximum) {
        setError(`Maximum withdrawal: ₦${limits.maximum.toLocaleString()}`);
        return;
      }
      if (amount > limits.daily.remaining) {
        setError(`Exceeds daily limit. Remaining: ₦${limits.daily.remaining.toLocaleString()}`);
        return;
      }
    }
    
    const { totalDeduction } = calculateFees(amount);
    if (totalDeduction > balance) {
      setError(`Insufficient balance`);
      return;
    }
    
    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!accountResolved) {
      setError('Please wait for account verification');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.post('/api/withdrawal/request', {
        amount,
        bankCode: formData.bankCode,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        narration: 'Lordmoon Wallet Withdrawal'
      });

      if (response.success) {
        router.push('/wallet?withdrawal=success');
      } else {
        setError(response.message || 'Withdrawal failed');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleBankSelect = (bank: NigerianBank) => {
    setFormData(prev => ({ 
      ...prev, 
      bankName: bank.name,
      bankCode: bank.code 
    }));
    setBankSearch(bank.name);
    setShowBankDropdown(false);
    setAccountResolved(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Compact Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-3 py-2.5 flex items-center gap-2">
          <button
            onClick={() => router.push('/wallet')}
            className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-all active:scale-95"
          >
            <IoArrowBack className="w-4 h-4 text-slate-200" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white">Withdraw</h1>
            <p className="text-[10px] text-slate-400">To bank account</p>
          </div>
        </div>
      </div>

      {/* Compact Content */}
      <div className="max-w-md mx-auto p-3 space-y-3">
        {/* Compact Balance */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl p-3 text-white shadow-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <IoWalletOutline className="w-4 h-4" />
            <span className="text-xs opacity-90 font-medium">Balance</span>
          </div>
          <p className="text-2xl font-bold tracking-tight">₦{balance.toLocaleString()}</p>
        </div>

        {/* Compact Limits */}
        {limits && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 mb-2">
              <IoInformationCircleOutline className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">Limits</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-700/30 rounded-lg p-2">
                <p className="text-[10px] text-slate-400 mb-0.5">Daily</p>
                <p className="text-xs font-bold text-white">₦{limits.daily.remaining.toLocaleString()}</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-2">
                <p className="text-[10px] text-slate-400 mb-0.5">Fee</p>
                <p className="text-xs font-bold text-emerald-400">0.5%</p>
              </div>
            </div>
          </div>
        )}

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Compact Amount */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              <IoCashOutline className="inline w-3.5 h-3.5 mr-1" />
              Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-700/50 text-white placeholder-slate-400 font-medium"
              required
            />
            
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-slate-700/50 border border-slate-600 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-semibold text-white">₦{parseFloat(formData.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Fee (0.5%):</span>
                  <span className="font-semibold text-rose-400">
                    -₦{calculateFees(parseFloat(formData.amount)).fee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-600">
                  <span className="text-[11px] font-semibold text-slate-200">Receive:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    ₦{calculateFees(parseFloat(formData.amount)).netAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Compact Bank */}
          <div className="bank-dropdown-container bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 relative z-30">
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              <IoCardOutline className="inline w-3.5 h-3.5 mr-1" />
              Bank
            </label>
            <div className="relative">
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => {
                  setBankSearch(e.target.value);
                  if (!showBankDropdown) setShowBankDropdown(true);
                }}
                onFocus={() => setShowBankDropdown(true)}
                placeholder="Search bank"
                className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 pr-8 bg-slate-700/50 text-white placeholder-slate-400 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowBankDropdown(!showBankDropdown)}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center hover:bg-slate-600/50 rounded transition-colors"
              >
                <IoChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBankDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showBankDropdown && filteredBanks.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl max-h-40 overflow-y-auto">
                  {filteredBanks.map((bank, index) => (
                    <button
                      key={`${bank.id}-${bank.code}-${index}`}
                      type="button"
                      onClick={() => handleBankSelect(bank)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-700 border-b border-slate-700 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-white text-xs">{bank.name}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {showBankDropdown && filteredBanks.length === 0 && bankSearch && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl">
                  <div className="px-3 py-2 text-slate-400 text-xs">No banks found</div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Account Number */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              <IoDocumentTextOutline className="inline w-3.5 h-3.5 mr-1" />
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit number"
              className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-700/50 text-white placeholder-slate-400 font-medium"
              required
              maxLength={10}
            />
          </div>

          {/* Compact Account Name */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              <IoPersonOutline className="inline w-3.5 h-3.5 mr-1" />
              Account Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.accountName}
                readOnly
                placeholder={resolvingAccount ? "Verifying..." : "Auto-filled"}
                className={`w-full px-3 py-2 text-sm border rounded-lg font-medium ${
                  accountResolved 
                    ? 'border-emerald-500 bg-emerald-900/20 text-emerald-300' 
                    : 'border-slate-600 bg-slate-700/50 text-slate-400'
                } placeholder-slate-500`}
              />
              {resolvingAccount && (
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-cyan-400"></div>
                </div>
              )}
              {accountResolved && (
                <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                  <IoCheckmarkCircle className="w-4 h-4 text-emerald-400" />
                </div>
              )}
            </div>
          </div>

          {/* Compact Error */}
          {error && (
            <div className="p-2.5 bg-rose-900/30 border border-rose-700/50 rounded-lg flex items-start gap-2">
              <IoWarningOutline className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300">{error}</p>
            </div>
          )}

          {/* Compact Success */}
          {accountResolved && !error && (
            <div className="p-2.5 bg-emerald-900/30 border border-emerald-700/50 rounded-lg flex items-center gap-2">
              <IoCheckmarkCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs font-semibold text-emerald-300">Verified!</p>
            </div>
          )}

          {/* Compact Submit */}
          <button
            type="submit"
            disabled={loading || !accountResolved || resolvingAccount || !formData.amount}
            className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all font-bold text-sm disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-xs">Processing...</span>
              </div>
            ) : (
              'Withdraw Now'
            )}
          </button>

          {/* Compact Info */}
          <div className="text-[10px] text-slate-400 text-center pb-2">
            <p>Instant for supported banks • 10-30 min standard</p>
          </div>
        </form>
      </div>
    </div>
  );
}
