"use client";

import { useState, useEffect } from 'react';
import { IoClose, IoWalletOutline, IoCardOutline, IoPersonOutline, IoDocumentTextOutline, IoCashOutline, IoChevronDown, IoCheckmarkCircle, IoWarningOutline, IoInformationCircleOutline, IoTimeOutline } from 'react-icons/io5';
import { authApi } from '@/lib/auth-api';
import { resolveAccountName, getBankByCode, type NigerianBank } from '@/services/bankService';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}

interface WithdrawalLimits {
  daily: {
    limit: number;
    used: number;
    remaining: number;
  };
  monthly: {
    limit: number;
    used: number;
    remaining: number;
  };
  minimum: number;
  maximum: number;
  fee: {
    percentage: number;
    minimum: number;
  };
}

interface WithdrawalResult {
  reference: string;
  status: string;
  estimatedTime?: string;
  amount: number;
  accountName: string;
  submittedAt: string;
}

interface FlutterwaveBank {
  id: number;
  code: string;
  name: string;
}

export default function WithdrawalModal({ isOpen, onClose, balance, onSuccess }: WithdrawalModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [accountResolved, setAccountResolved] = useState(false);
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [withdrawalResult, setWithdrawalResult] = useState<WithdrawalResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [banks, setBanks] = useState<FlutterwaveBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Load withdrawal limits and banks when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWithdrawalLimits();
      loadBanks();
    }
  }, [isOpen]);

  const loadWithdrawalLimits = async () => {
    setLoadingLimits(true);
    try {
      const response = await authApi.get('/api/withdrawal/limits');
      if (response.success) {
        setLimits(response.data);
      }
    } catch (error) {
      console.error('Failed to load withdrawal limits:', error);
    } finally {
      setLoadingLimits(false);
    }
  };

  const loadBanks = async () => {
    setLoadingBanks(true);
    try {
      const response = await authApi.getBanks();
      if (response.success && response.data) {
        setBanks(response.data);
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

  // Calculate fees and net amount with 0.5% fee
  const calculateFees = (amount: number) => {
    if (!amount) return { fee: 0, netAmount: 0, totalDeduction: 0 };
    
    const feePercentage = 0.005; // 0.5% fee
    const fee = amount * feePercentage; // 0.5% of the withdrawal amount
    const netAmount = amount - fee; // User receives amount minus fee
    const totalDeduction = amount; // Only deduct the requested amount from wallet
    
    return { fee, netAmount, totalDeduction };
  };

  // Filter banks based on search
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

  // Auto-resolve account name when account number and bank are provided
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
            setError(response.message || 'Could not verify account details. Please check account number and bank.');
            setFormData(prev => ({ ...prev, accountName: '' }));
          }
        } catch (error) {
          console.error('Account resolution failed:', error);
          setError('Failed to verify account. Please try again.');
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
    
    // Enhanced validation
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (limits) {
      if (amount < limits.minimum) {
        setError(`Minimum withdrawal amount is ₦${limits.minimum.toLocaleString()}`);
        return;
      }

      if (amount > limits.maximum) {
        setError(`Maximum withdrawal amount is ₦${limits.maximum.toLocaleString()}`);
        return;
      }

      if (amount > limits.daily.remaining) {
        setError(`Amount exceeds daily limit. Remaining: ₦${limits.daily.remaining.toLocaleString()}`);
        return;
      }

      if (amount > limits.monthly.remaining) {
        setError(`Amount exceeds monthly limit. Remaining: ₦${limits.monthly.remaining.toLocaleString()}`);
        return;
      }
    }
    
    // Check balance - user needs enough NGN for the withdrawal request
    const { totalDeduction, fee } = calculateFees(amount);
    if (totalDeduction > (balance || 0)) {
      setError(`Insufficient balance! You need ₦${totalDeduction.toLocaleString()} (₦${amount.toLocaleString()} + ₦${fee.toLocaleString()} fee) but only have ₦${(balance || 0).toLocaleString()}`);
      return;
    }
    
    // Also check if amount alone exceeds balance
    if (amount > (balance || 0)) {
      setError(`Withdrawal amount (₦${amount.toLocaleString()}) exceeds your available balance (₦${(balance || 0).toLocaleString()})`);
      return;
    }
    
    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.accountNumber.length !== 10) {
      setError('Account number must be exactly 10 digits');
      return;
    }

    if (!accountResolved) {
      setError('Please wait for account name verification');
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
        narration: formData.remarks || 'Lordmoon Wallet Withdrawal'
      });

      if (response.success) {
        setWithdrawalResult(response.data);
        setShowSuccess(true);
        onSuccess();
        // Don't close modal immediately, show success state
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

  const resetForm = () => {
    setFormData({
      amount: '',
      bankName: '',
      bankCode: '',
      accountNumber: '',
      accountName: '',
      remarks: ''
    });
    setBankSearch('');
    setAccountResolved(false);
    setWithdrawalResult(null);
    setShowSuccess(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Success state
  if (showSuccess && withdrawalResult) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md">
          {/* Success Header */}
          <div className="p-6 text-center border-b border-gray-200">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <IoCheckmarkCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Withdrawal Submitted!</h2>
            <p className="text-sm text-gray-600">Your withdrawal request has been processed</p>
          </div>

          {/* Success Details */}
          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <IoCheckmarkCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Status: {withdrawalResult.status}</span>
              </div>
              {withdrawalResult.estimatedTime && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <IoTimeOutline className="w-4 h-4" />
                  <span>Estimated time: {withdrawalResult.estimatedTime}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">₦{withdrawalResult.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account:</span>
                <span className="font-medium">{withdrawalResult.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono text-sm">{withdrawalResult.reference}</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header - Clean and spacious */}
        <div className="flex items-center justify-between max-[360px]:p-3 p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 flex items-center justify-center">
              <IoCashOutline className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Withdraw NGN</h2>
              <p className="text-xs sm:text-sm text-gray-600">To bank account</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <IoClose className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Balance Info - Well-spaced */}
        <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <IoWalletOutline className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Available Balance</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">₦{(balance || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Withdrawal Limits - Well-spaced */}
          {limits && !loadingLimits && (
            <div className="bg-white/70 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <IoInformationCircleOutline className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Withdrawal Limits</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-600">Daily Remaining</p>
                  <p className="font-medium text-gray-900">₦{limits.daily.remaining.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Monthly Remaining</p>
                  <p className="font-medium text-gray-900">₦{limits.monthly.remaining.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                Fee: 0.5% of withdrawal amount
              </div>
            </div>
          )}
        </div>

        {/* Form - Well-spaced and scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
          {/* Amount Input - Well-spaced */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <IoCashOutline className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Amount (NGN)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount to withdraw"
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              required
              min={limits?.minimum || 1}
              max={Math.min((balance || 0), limits?.daily.remaining || Infinity, limits?.monthly.remaining || Infinity)}
            />
            
            {/* Fee Calculation */}
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <div className={`mt-2 p-3 rounded-lg ${
                calculateFees(parseFloat(formData.amount)).totalDeduction > (balance || 0)
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Withdrawal Request:</span>
                    <span className="font-medium">₦{parseFloat(formData.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee (0.5%):</span>
                    <span className="font-medium text-red-600">
                      -₦{calculateFees(parseFloat(formData.amount)).fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-2">
                    <span className="text-gray-900 font-medium">Deducted from Wallet:</span>
                    <span className={`font-bold ${
                      calculateFees(parseFloat(formData.amount)).totalDeduction > (balance || 0)
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}>
                      ₦{calculateFees(parseFloat(formData.amount)).totalDeduction.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">You'll Receive in Bank:</span>
                    <span className="font-bold text-green-600">
                      ₦{calculateFees(parseFloat(formData.amount)).netAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-xs text-gray-600 text-center">
                      <span className="font-medium">Calculation:</span> {parseFloat(formData.amount).toFixed(2)} - {calculateFees(parseFloat(formData.amount)).fee.toFixed(2)} (0.5% fee) = ₦{calculateFees(parseFloat(formData.amount)).netAmount.toFixed(2)}
                    </div>
                  </div>
                  
                  {/* Warning if exceeds balance */}
                  {calculateFees(parseFloat(formData.amount)).totalDeduction > (balance || 0) && (
                    <div className="flex items-start gap-2 mt-3 pt-3 border-t">
                      <IoWarningOutline className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-red-700">
                        <p className="font-semibold text-sm">Insufficient Balance!</p>
                        <p className="text-xs mt-1">
                          You need ₦{calculateFees(parseFloat(formData.amount)).totalDeduction.toLocaleString()} 
                          {' '}but only have ₦{(balance || 0).toLocaleString()} available.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bank Selection - Well-spaced */}
          <div className="bank-dropdown-container">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <IoCardOutline className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Select Bank
            </label>
            <div className="relative">
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => {
                  setBankSearch(e.target.value);
                  setShowBankDropdown(true);
                }}
                onFocus={() => setShowBankDropdown(true)}
                placeholder="Search for your bank"
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-gray-900 bg-white placeholder-gray-500"
                required
              />
              <IoChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              
              {showBankDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredBanks.length > 0 ? (
                    filteredBanks.map((bank, index) => (
                      <button
                        key={`${bank.id}-${bank.code}-${index}`}
                        type="button"
                        onClick={() => handleBankSelect(bank)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{bank.name}</div>
                        <div className="text-sm text-gray-500">{bank.code}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">No banks found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Account Number - Well-spaced */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <IoDocumentTextOutline className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Account Number
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter 10-digit account number"
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              required
              maxLength={10}
            />
          </div>

          {/* Account Name - Handles long names */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              <IoPersonOutline className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Account Name
            </label>
            <div className="relative">
              {formData.accountName ? (
                <div className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-xs xs:text-sm sm:text-base border rounded-lg pr-10 ${
                  accountResolved 
                    ? 'border-green-300 bg-green-50 text-green-800' 
                    : 'border-gray-300 bg-gray-50 text-gray-700'
                } break-words leading-tight min-h-[42px] sm:min-h-[48px] flex items-center`}>
                  {formData.accountName}
                </div>
              ) : (
                <input
                  type="text"
                  value=""
                  readOnly
                  placeholder={resolvingAccount ? "Verifying account..." : "Account name will appear here"}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 bg-gray-50 text-gray-700 rounded-lg placeholder-gray-500"
                />
              )}
              {resolvingAccount && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full w-4 h-4 sm:w-5 sm:h-5 border-b-2 border-blue-500"></div>
                </div>
              )}
              {accountResolved && (
                <div className="absolute right-3 top-3 sm:top-1/2 sm:transform sm:-translate-y-1/2">
                  <IoCheckmarkCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
              )}
            </div>
            {formData.accountName && formData.accountName.length > 25 && (
              <p className="text-xs text-gray-500 mt-1">Long names are supported</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <IoWarningOutline className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info Message */}
          {accountResolved && !error && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <IoCheckmarkCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-medium">Account verified successfully!</p>
                <p>Ready to process withdrawal to {formData.accountName}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !accountResolved || resolvingAccount || !formData.amount}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Withdrawal...
              </div>
            ) : resolvingAccount ? (
              'Verifying Account...'
            ) : !accountResolved && formData.accountNumber.length === 10 && formData.bankCode ? (
              'Verify Account First'
            ) : (
              'Submit Withdrawal Request'
            )}
          </button>

          {/* Processing Info */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• Instant transfers available for supported banks</p>
            <p>• Standard transfers take 10-30 minutes</p>
            <p>• You'll receive a confirmation once processed</p>
          </div>
        </form>
      </div>
    </div>
  );
}