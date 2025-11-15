"use client";

import { useState, useEffect } from 'react';
import { IoWalletOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoRefreshOutline } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth-api';

interface WalletStatus {
  connected: boolean;
  provider?: string;
  address?: string;
}

export default function WalletConnect() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<WalletStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const loadStatus = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await authApi.get('/api/wallets/status');
      if (response.success) {
        setStatus(response.data ?? { connected: false });
      }
    } catch (error) {
      console.error('Failed to load wallet status:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    if (!accessToken) return;
    setConnecting(true);
    try {
      const response = await authApi.post('/api/wallets/connect', {});
      if (response.success) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (!accessToken) return;
    setConnecting(true);
    try {
      const response = await authApi.post('/api/wallets/disconnect', {});
      if (response.success) {
        setStatus({ connected: false });
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            status.connected 
              ? 'bg-green-100 text-green-600' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <IoWalletOutline className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Wallet Connection</h4>
            <p className="text-sm text-gray-500">
              {status.connected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {status.connected ? (
            <IoCheckmarkCircleOutline className="w-5 h-5 text-green-500" />
          ) : (
            <IoCloseCircleOutline className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {status.connected && status.address && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Connected Address:</p>
          <p className="text-sm font-mono text-gray-900 break-all">
            {status.address}
          </p>
          {status.provider && (
            <p className="text-xs text-gray-500 mt-1">
              Provider: {status.provider}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {status.connected ? (
          <button
            onClick={disconnectWallet}
            disabled={connecting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {connecting ? (
              <IoRefreshOutline className="w-4 h-4 animate-spin" />
            ) : (
              <IoCloseCircleOutline className="w-4 h-4" />
            )}
            {connecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        ) : (
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {connecting ? (
              <IoRefreshOutline className="w-4 h-4 animate-spin" />
            ) : (
              <IoWalletOutline className="w-4 h-4" />
            )}
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
        
        <button
          onClick={loadStatus}
          disabled={loading || connecting}
          className="px-4 py-2 border border-gray-300 hover:border-gray-400 disabled:border-gray-200 text-gray-700 disabled:text-gray-400 rounded-lg transition-colors flex items-center justify-center"
        >
          <IoRefreshOutline className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}