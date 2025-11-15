'use client';

import { useState } from 'react';
import { 
  IoPhonePortraitOutline, 
  IoWifiOutline, 
  IoTvOutline, 
  IoFlashOutline,
  IoStatsChartOutline,
  IoSettingsOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline
} from 'react-icons/io5';

export default function AdminVTUPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in real app, this would come from API
  const vtuStats = {
    totalTransactions: 1250,
    totalRevenue: 45600,
    successRate: 98.5,
    activeProviders: 12
  };

  const recentTransactions = [
    {
      id: '1',
      user: 'john_doe',
      type: 'Airtime',
      provider: 'MTN',
      amount: 1000,
      status: 'completed',
      timestamp: '2024-01-15 14:30'
    },
    {
      id: '2',
      user: 'jane_smith',
      type: 'Data',
      provider: 'Airtel',
      amount: 2500,
      status: 'pending',
      timestamp: '2024-01-15 14:25'
    },
    {
      id: '3',
      user: 'mike_wilson',
      type: 'Cable TV',
      provider: 'DSTV',
      amount: 5000,
      status: 'failed',
      timestamp: '2024-01-15 14:20'
    }
  ];

  const providers = [
    { name: 'MTN', type: 'Telecom', status: 'active', commission: '2.5%' },
    { name: 'Airtel', type: 'Telecom', status: 'active', commission: '2.3%' },
    { name: 'Glo', type: 'Telecom', status: 'maintenance', commission: '2.8%' },
    { name: 'DSTV', type: 'Cable TV', status: 'active', commission: '3.0%' },
    { name: 'GOTV', type: 'Cable TV', status: 'active', commission: '2.7%' },
    { name: 'EKEDC', type: 'Electricity', status: 'active', commission: '1.5%' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'maintenance': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: IoStatsChartOutline },
    { id: 'transactions', label: 'Transactions', icon: IoPhonePortraitOutline },
    { id: 'providers', label: 'Providers', icon: IoSettingsOutline }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VTU Management</h1>
          <p className="text-gray-600">Manage virtual top-up services and providers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Transactions</p>
                      <p className="text-2xl font-bold">{vtuStats.totalTransactions.toLocaleString()}</p>
                    </div>
                    <IoPhonePortraitOutline className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold">₦{vtuStats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <IoStatsChartOutline className="w-8 h-8 text-green-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Success Rate</p>
                      <p className="text-2xl font-bold">{vtuStats.successRate}%</p>
                    </div>
                    <IoCheckmarkCircleOutline className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Active Providers</p>
                      <p className="text-2xl font-bold">{vtuStats.activeProviders}</p>
                    </div>
                    <IoSettingsOutline className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IoPhonePortraitOutline className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.user}</p>
                          <p className="text-sm text-gray-500">{transaction.type} - {transaction.provider}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₦{transaction.amount.toLocaleString()}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Export Data
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{transaction.user}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{transaction.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{transaction.provider}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">₦{transaction.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{transaction.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Service Providers</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Provider
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(provider.status)}`}>
                        {provider.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Type: {provider.type}</p>
                    <p className="text-sm text-gray-600 mb-3">Commission: {provider.commission}</p>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                        Configure
                      </button>
                      <button className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}