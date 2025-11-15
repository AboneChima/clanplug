'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/AppShell';
import {
  IoWalletOutline,
  IoPhonePortraitOutline,
  IoSettingsOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoShieldCheckmarkOutline,
  IoDocumentTextOutline,
  IoStatsChartOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';

export default function MorePage() {
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: 'Account',
      items: [
        { href: '/wallet', label: 'Wallet', icon: IoWalletOutline, color: 'text-green-500' },
        { href: '/vtu', label: 'Airtime & Data', icon: IoPhonePortraitOutline, color: 'text-purple-500' },
        { href: '/kyc', label: 'KYC Verification', icon: IoShieldCheckmarkOutline, color: 'text-blue-500' },
        { href: '/analytics', label: 'Analytics', icon: IoStatsChartOutline, color: 'text-orange-500' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { href: '/settings', label: 'Settings', icon: IoSettingsOutline, color: 'text-gray-500' },
        { href: '/notifications', label: 'Notifications', icon: IoNotificationsOutline, color: 'text-red-500' },
      ]
    },
    {
      title: 'Support',
      items: [
        { href: '/help', label: 'Help & Support', icon: IoHelpCircleOutline, color: 'text-indigo-500' },
        { href: '/terms', label: 'Terms & Conditions', icon: IoDocumentTextOutline, color: 'text-gray-500' },
      ]
    }
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-48 lg:pb-8">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-6">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">More</h1>
            <p className="text-sm sm:text-base text-white/90">Settings and additional options</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          {/* User Info Card */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700 shadow-xl">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-400 truncate">@{user?.username}</p>
              </div>
              {user?.isKYCVerified && (
                <div className="flex-shrink-0">
                  <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                    <span className="text-xs font-medium text-green-400">Verified</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu Sections */}
          {menuItems.map((section, idx) => (
            <div key={idx} className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
              <div className="divide-y divide-slate-700">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className={`${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="flex-1 text-white font-medium">{item.label}</span>
                      <IoChevronForwardOutline className="w-5 h-5 text-gray-400" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-colors"
          >
            <IoLogOutOutline className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold">Sign Out</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
