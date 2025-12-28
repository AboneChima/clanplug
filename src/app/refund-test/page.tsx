'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import AppShell from '@/components/AppShell';
import { IoRefreshOutline, IoCheckmarkCircle } from 'react-icons/io5';

export default function RefundTestPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRefund = async () => {
    if (!confirm('Refund all test purchases? This will return money to your wallet and make listings active again.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/refund/test-purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        showToast(`✅ Refunded ${data.refundedCount} purchase(s)!`, 'success');
      } else {
        showToast(data.message || 'Failed to process refund', 'error');
      }
    } catch (error) {
      console.error('Refund error:', error);
      showToast('Failed to process refund', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Test Purchase Refund</h1>
            <p className="text-gray-400 mb-6">
              Click the button below to refund all your test purchases.
              <br />
              Money will be returned to your wallet and listings will become active again.
            </p>

            {!result ? (
              <button
                onClick={handleRefund}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <IoRefreshOutline className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <IoRefreshOutline className="w-5 h-5" />
                    Refund Test Purchases
                  </>
                )}
              </button>
            ) : (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
                <IoCheckmarkCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Refund Successful!</h2>
                <div className="text-left max-w-md mx-auto space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="font-semibold">Purchases Refunded:</span> {result.refundedCount}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">Total Amount:</span> {result.totalRefunded} {result.currency}
                  </p>
                  <p className="text-green-400 mt-4">
                    ✅ Money has been returned to your wallet
                    <br />
                    ✅ Listings are now active again
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = '/wallet'}
                  className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  View Wallet
                </button>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-6">
              User: {user?.email}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
