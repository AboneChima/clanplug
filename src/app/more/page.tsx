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
        { href: '/orders', label: 'My Orders', icon: IoStatsChartOutline, color: 'text-orange-500' },
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8">
        {/* Hero Header - Compact for Extra Small */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-2 xs:mb-3 sm:mb-4 md:mb-6">
          <div className="max-w-2xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 py-2.5 xs:py-3 sm:py-4 md:py-6 lg:py-8">
            <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-0.5 xs:mb-1 sm:mb-2">More</h1>
            <p className="text-[10px] xs:text-xs sm:text-sm md:text-base text-white/90">Settings & options</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-2 xs:px-3 sm:px-4 md:px-6 space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-6">
          {/* User Info Card - Compact for Extra Small */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg xs:rounded-xl p-2 xs:p-2.5 sm:p-3 md:p-4 border border-slate-700 shadow-xl">
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.username} 
                  className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white">
                    {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h2 className="text-xs xs:text-sm sm:text-base md:text-lg font-semibold text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  {((user as any)?.verificationBadge?.status === 'verified' || (user as any)?.verificationBadge?.status === 'active') && (
                    <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-gray-400 truncate">@{user?.username}</p>
              </div>
              {user?.isKYCVerified && (
                <div className="flex-shrink-0">
                  <div className="px-1.5 xs:px-2 py-0.5 xs:py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                    <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium text-green-400">Verified</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu Sections - Compact for Extra Small */}
          {menuItems.map((section, idx) => (
            <div key={idx} className="bg-slate-800/80 backdrop-blur-sm rounded-lg xs:rounded-xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="px-2 xs:px-2.5 sm:px-3 md:px-4 py-1.5 xs:py-2 sm:py-2.5 md:py-3 border-b border-slate-700">
                <h3 className="text-[10px] xs:text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
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
                      className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 px-2 xs:px-2.5 sm:px-3 md:px-4 py-2 xs:py-2.5 sm:py-3 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className={`${item.color}`}>
                        <Icon className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
                      </div>
                      <span className="flex-1 text-white font-medium text-[11px] xs:text-xs sm:text-sm md:text-base">{item.label}</span>
                      <IoChevronForwardOutline className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-gray-400" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Logout Button - Compact for Extra Small */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg xs:rounded-xl transition-colors"
          >
            <IoLogOutOutline className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 text-red-400" />
            <span className="text-red-400 font-semibold text-[11px] xs:text-xs sm:text-sm md:text-base">Sign Out</span>
          </button>

          {/* Footer */}
          <div className="text-center py-4 sm:py-6">
            <p className="text-xs sm:text-sm text-gray-500">
              Developed by <span className="text-blue-400 font-semibold">De Oracle</span>
            </p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1">© 2025 ClanPlug. All rights reserved.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
