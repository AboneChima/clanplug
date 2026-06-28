"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  IoGridOutline, 
  IoWalletOutline, 
  IoChatbubbleEllipsesOutline, 
  IoStorefrontOutline, 
  IoSettingsOutline, 
  IoLogOutOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoReceiptOutline,
  IoTrophyOutline,
  IoPeopleOutline
} from 'react-icons/io5';

type User = {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  avatar?: string;
  verificationBadge?: {
    status: string;
    expiresAt?: string;
  };
};

type SidebarProps = {
  user: User;
  onLogout: () => void;
};

const navItems = [
  { 
    href: '/feed', 
    label: 'Dashboard', 
    Icon: IoGridOutline
  },
  { 
    href: '/posts', 
    label: 'Shop', 
    Icon: IoStorefrontOutline
  },
  { 
    href: '/top-up', 
    label: 'Top Up', 
    Icon: IoWalletOutline,
    comingSoon: true
  },
  { 
    href: '/groups', 
    label: 'Groups', 
    Icon: IoPeopleOutline,
    comingSoon: true
  },
  { 
    href: '/tournaments', 
    label: 'Tournaments', 
    Icon: IoTrophyOutline,
    comingSoon: true
  },
  { 
    href: '/kyc', 
    label: 'KYC Verification', 
    Icon: IoShieldCheckmarkOutline
  },
  { 
    href: '/chat', 
    label: 'Messages', 
    Icon: IoChatbubbleEllipsesOutline
  },
  { 
    href: '/profile', 
    label: 'Profile', 
    Icon: IoPersonOutline
  },
  { 
    href: '/settings', 
    label: 'Settings', 
    Icon: IoSettingsOutline
  },
];

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const getUserDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  const getUserInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return (user.firstName?.[0] || user.lastName?.[0] || user.username?.[0] || 'U').toUpperCase();
  };

  return (
    <aside className="h-full bg-black border-r border-[#2f3336] flex flex-col overflow-hidden">
      {/* User Profile Header */}
      <div className="p-4 border-b border-[#2f3336] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-blue-500 to-slate-700">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1a1a] p-0.5">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.username || 'User'} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#2a2a2a] flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{getUserInitials()}</span>
                  </div>
                )}
              </div>
            </div>
            {(user.verificationBadge?.status === 'verified' || user.verificationBadge?.status === 'active') && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-black">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{getUserDisplayName()}</h2>
            <p className="text-xs text-gray-500 truncate">@{user.username}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto overscroll-contain min-h-0">
        <div className="space-y-1">
          {navItems.map(({ href, label, Icon, comingSoon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

            if (comingSoon) {
              return (
                <div
                  key={href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-60 cursor-not-allowed"
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500 flex-1">{label}</span>
                  <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide">Soon</span>
                </div>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-[#2f3336]">
          <div className="space-y-1">
            <Link 
              href="/notifications" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-all group"
            >
              <IoNotificationsOutline className="w-5 h-5" />
              <span className="text-sm font-medium">Notifications</span>
              <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
            </Link>
            
            <Link
              href="/help"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-[#1a1a1a] hover:text-white transition-all group"
            >
              <IoHelpCircleOutline className="w-5 h-5" />
              <span className="text-sm font-medium">Help</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Logout Section */}
      <div className="p-3 border-t border-[#2f3336] flex-shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30"
        >
          <IoLogOutOutline className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
