"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  IoGridOutline, 
  IoWalletOutline, 
  IoChatbubbleEllipsesOutline, 
  IoDocumentTextOutline, 
  IoSettingsOutline, 
  IoLogOutOutline,
  IoStatsChartOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoPhonePortraitOutline,
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
    href: '/wallet', 
    label: 'Wallet', 
    Icon: IoWalletOutline
  },
  { 
    href: '/vtu', 
    label: 'Airtime & Data', 
    Icon: IoPhonePortraitOutline
  },
  { 
    href: '/posts', 
    label: 'Marketplace', 
    Icon: IoDocumentTextOutline
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
    <aside className="h-screen bg-slate-900 border-r border-slate-800 flex flex-col animate-fade-in">
      {/* User Profile Header - Compact */}
      <div className="p-2 sm:p-3 border-b border-slate-800 flex-shrink-0 bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="relative">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username || 'User'} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-white">{getUserInitials()}</span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">{getUserDisplayName()}</h2>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        
        {/* User Status - Compact */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
            <IoShieldCheckmarkOutline className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
            <span className="text-[9px] sm:text-[10px] font-medium text-blue-300 capitalize">{user.role}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[9px] sm:text-[10px] font-medium text-green-300">Online</span>
          </div>
        </div>
      </div>

      {/* Navigation - Compact */}
      <nav className="flex-1 p-2 overflow-y-auto pb-48 lg:pb-4">
        <div className="space-y-1">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all group ${
                  active 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className={`
                  w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0
                  ${active 
                    ? 'bg-blue-600/30 text-blue-400' 
                    : 'bg-slate-800 text-gray-400 group-hover:bg-slate-700 group-hover:text-white'
                  }
                `}>
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <span className="text-xs sm:text-sm font-medium truncate">{label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions - Compact */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="space-y-1">
            <Link href="/notifications" className="flex items-center gap-2 px-2 py-2 rounded-lg text-gray-400 hover:bg-slate-800 hover:text-white transition-all group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-slate-700 group-hover:text-white transition-all flex-shrink-0">
                <IoNotificationsOutline className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium truncate">Notifications</span>
              <div className="ml-auto w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            </Link>
            
            <button className="flex items-center gap-2 px-2 py-2 rounded-lg text-gray-400 hover:bg-slate-800 hover:text-white transition-all group w-full">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-slate-700 group-hover:text-white transition-all flex-shrink-0">
                <IoHelpCircleOutline className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium truncate">Help</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Logout Section - Hidden on mobile, Compact */}
      <div className="hidden lg:block p-2 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 group"
        >
          <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-all flex-shrink-0">
            <IoLogOutOutline className="w-4 h-4" />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}