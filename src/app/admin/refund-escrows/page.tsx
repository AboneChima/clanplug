'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function RefundEscrowsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleRefundAll = async () => {
    if (!confirm('⚠️ This will refund ALL active escrows. Are you sure?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/escrow/refund-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResults(data);
      
      if (data.success) {
        alert(`✅ Success! Refunded ${data.data.length} escrows`);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Failed to refund escrows');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">Admin access required</p>
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Refund All Escrows</h1>
          <p className="text-gray-400 mb-6">
            This will cancel all active escrows and refund money to buyers
          </p>

          <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4 mb-6">
            <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Warning</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• All FUNDED and PENDING escrows will be cancelled</li>
              <li>• Money (including fees) will be refunded to buyers</li>
              <li>• Buyers will receive notifications</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          <button
            onClick={handleRefundAll}
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Refund All Escrows'}
          </button>
        </div>

        {results && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Results</h2>
            
            {results.success ? (
              <div className="space-y-2">
                <p className="text-green-400 font-semibold mb-4">
                  ✅ Successfully processed {results.data.length} escrows
                </p>
                
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {results.data.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        item.status === 'refunded'
                          ? 'bg-green-900/20 border border-green-500/30'
                          : 'bg-red-900/20 border border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">@{item.buyer}</p>
                          <p className="text-gray-400 text-sm">
                            {item.amount} {item.currency}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'refunded'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      {item.error && (
                        <p className="text-red-400 text-xs mt-2">{item.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400">❌ {results.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
