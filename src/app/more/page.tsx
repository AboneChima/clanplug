'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/AppShell';
import {
  IoPersonOutline,
  IoSettingsOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoChevronForwardOutline,
  IoTrophyOutline,
  IoShieldCheckmarkOutline,
  IoReceiptOutline
} from 'react-icons/io5';
import Image from 'next/image';

export default function MorePage() {
  const { user, logout } = useAuth();

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
  };

  const menuItems = [
    {
      title: 'Account',
      items: [
        { href: '/profile', label: 'Profile', icon: IoPersonOutline, color: 'text-blue-500' },
        { href: '/kyc', label: 'KYC Verification', icon: IoShieldCheckmarkOutline, color: 'text-blue-500' },
      ]
    },
    {
      title: 'Features',
      items: [
        { label: 'Tournaments', icon: IoTrophyOutline, color: 'text-purple-500', comingSoon: true },
      ]
    },
    {
      title: 'Settings',
      items: [
        { href: '/settings', label: 'Settings', icon: IoSettingsOutline, color: 'text-gray-400' },
        { href: '/help', label: 'Help & Support', icon: IoHelpCircleOutline, color: 'text-green-500' },
      ]
    }
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-black pb-20 lg:pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-[#2f3336] px-4 py-3">
          <h1 className="text-xl font-bold text-white">More</h1>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* User Info Card */}
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2f3336]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-blue-500 to-slate-700">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1a1a] p-0.5">
                    {user?.avatar ? (
                      <Image src={user.avatar} alt={user.username} width={48} height={48} className="w-full h-full rounded-full object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#2a2a2a] flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{getUserInitials()}</span>
                      </div>
                    )}
                  </div>
                </div>
                {((user as any)?.verificationBadge?.status === 'verified' || (user as any)?.verificationBadge?.status === 'active') && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#1a1a1a]">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
              </div>
              {user?.isKYCVerified && (
                <div className="flex-shrink-0">
                  <div className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                    <span className="text-xs font-medium text-green-400">Verified</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu Sections */}
          {menuItems.map((section, idx) => (
            <div key={idx}>
              <div className="px-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#2f3336] overflow-hidden">
                <div className="divide-y divide-[#2f3336]">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    
                    if ('comingSoon' in item && item.comingSoon) {
                      return (
                        <div
                          key={itemIdx}
                          className="flex items-center gap-3 px-4 py-3.5 opacity-60"
                        >
                          <div className={`w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center ${item.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="flex-1 text-white font-medium text-sm">{item.label}</span>
                          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Soon</span>
                        </div>
                      );
                    }

                    const linkItem = item as { href: string; label: string; icon: any; color: string };
                    return (
                      <Link
                        key={linkItem.href}
                        href={linkItem.href}
                        className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#222] transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center ${linkItem.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="flex-1 text-white font-medium text-sm">{linkItem.label}</span>
                        <IoChevronForwardOutline className="w-5 h-5 text-gray-600" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl transition-colors"
          >
            <IoLogOutOutline className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold text-sm">Sign Out</span>
          </button>

          {/* Footer */}
          <div className="text-center py-6">
            <p className="text-xs text-gray-600">© 2025 ClanPlug. All rights reserved.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
