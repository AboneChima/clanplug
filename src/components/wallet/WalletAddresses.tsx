"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth-api';
import { 
  IoWalletOutline,
  IoCopyOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';

interface WalletAddresses {
  lmcAddress: string | null;
}

export default function WalletAddresses() {
  const { user, accessToken } = useAuth();
  const [addresses, setAddresses] = useState<WalletAddresses>({ lmcAddress: null });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (accessToken && user) {
      loadWalletAddresses();
    }
  }, [accessToken, user]);

  const loadWalletAddresses = async () => {
    try {
      setLoading(true);
      setError('');
      // Generate LMC address using user ID
      if (user?.id) {
        const lmcAddress = `${user.id.substring(0, 8)}-LMC-${user.id.substring(user.id.length - 8)}`;
        setAddresses({ lmcAddress });
      }
    } catch (err: any) {
      console.error('Failed to load wallet addresses:', err);
      setError('Failed to load wallet addresses');
    } finally {
      setLoading(false);
    }
  };

  const generateAddresses = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      // Generate new LMC address using user ID
      if (user?.id) {
        const lmcAddress = `${user.id.substring(0, 8)}-LMC-${user.id.substring(user.id.length - 8)}`;
        setAddresses({ lmcAddress });
        setSuccess('Wallet address generated successfully!');
      }
    } catch (err: any) {
      console.error('Failed to generate wallet addresses:', err);
      setError('Failed to generate wallet addresses');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(type);
      setTimeout(() => setCopying(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-200 rounded-xl"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header - Compact on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <IoWalletOutline className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">My Wallet Address</h2>
            <p className="text-gray-600 font-medium text-[10px] xs:text-xs sm:text-sm lg:text-base">Receive transfers</p>
          </div>
        </div>
        
        <button
          onClick={generateAddresses}
          disabled={generating}
          className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm hover-lift"
        >
          <IoRefreshOutline className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
          <IoAlertCircleOutline className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
          <IoCheckmarkCircleOutline className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        {/* LMC Address - Compact for mobile */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 p-2.5 xs:p-3 sm:p-4 md:p-6 border border-gray-200/50 rounded-lg xs:rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2 xs:mb-2.5 sm:mb-3 md:mb-4">
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm xs:text-base sm:text-lg">L</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm xs:text-base sm:text-lg">Wallet Address</h3>
                <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 hidden xs:block">For internal transfers</p>
              </div>
            </div>
            {addresses.lmcAddress && (
              <button
                onClick={() => copyToClipboard(addresses.lmcAddress!, 'lmc')}
                className="btn-secondary flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 text-[10px] xs:text-xs sm:text-sm hover-lift"
              >
                {copying === 'lmc' ? (
                  <IoCheckmarkCircleOutline className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-green-600" />
                ) : (
                  <IoCopyOutline className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
                )}
                <span className="hidden xs:inline">{copying === 'lmc' ? 'Copied!' : 'Copy'}</span>
              </button>
            )}
          </div>
          {addresses.lmcAddress ? (
            <div className="bg-gray-100/80 p-2 xs:p-2.5 sm:p-3 md:p-4 rounded-lg xs:rounded-xl border border-gray-200/50">
              <p className="font-mono text-[10px] xs:text-xs sm:text-sm text-gray-800 break-all leading-relaxed">{addresses.lmcAddress}</p>
            </div>
          ) : (
            <div className="bg-gray-100/80 p-2 xs:p-2.5 sm:p-3 md:p-4 rounded-lg xs:rounded-xl border border-gray-200/50 border-dashed">
              <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500 italic text-center">No wallet address generated yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50/50 border border-purple-200/50 rounded-2xl">
        <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
          <IoWalletOutline className="w-5 h-5" />
          How to use your wallet address
        </h4>
        <ul className="text-sm text-purple-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
            Share your wallet address to receive transfers from other users
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
            Use this address for internal transfers within the platform
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
            This address is unique to your account and permanent
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
            Fund your wallet by depositing NGN or USD via payment gateways
          </li>
        </ul>
      </div>
    </div>
  );
}