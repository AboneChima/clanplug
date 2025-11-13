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
    href: '/dashboard', 
    label: 'Dashboard', 
    Icon: IoGridOutline
  },
  { 
    href: '/feed', 
    label: 'Social Feed', 
    Icon: IoPeopleOutline
  },
  { 
    href: '/wallet', 
    label: 'Wallet', 
    Icon: IoWalletOutline
  },
  { 
    href: '/vtu', 
    label: 'VTU Services', 
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
    href: '/analytics', 
    label: 'Analytics', 
    Icon: IoStatsChartOutline
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
    <aside className="h-screen bg-card border-r border-border flex flex-col animate-fade-in">
      {/* User Profile Header - Always visible */}
      <div className="p-4 border-b border-border flex-shrink-0 bg-card">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.username || 'User'} 
                className="w-12 h-12 rounded-2xl object-cover shadow-brand"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand">
                <span className="text-lg font-bold text-brand-foreground">{getUserInitials()}</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-card"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-heading truncate">{getUserDisplayName()}</h2>
            <p className="text-caption truncate">{user.email}</p>
          </div>
        </div>
        
        {/* User Status */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <IoShieldCheckmarkOutline className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-300 capitalize">{user.role}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-300">Online</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {navItems.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${active ? 'nav-item-active' : ''} animate-scale-in`}
                style={{ animationDelay: `${navItems.indexOf(navItems.find(item => item.href === href)!) * 50}ms` }}
              >
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                  ${active 
                    ? 'bg-brand-foreground/20 text-brand-foreground' 
                    : 'bg-surface text-muted-foreground group-hover:bg-surface-hover group-hover:text-foreground'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{label}</span>
                {active && (
                  <div className="ml-auto w-2 h-2 bg-brand-foreground rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="space-y-2">
            <Link href="/notifications" className="nav-item w-full">
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-muted-foreground group-hover:bg-surface-hover group-hover:text-foreground transition-all duration-200">
                <IoNotificationsOutline className="w-5 h-5" />
              </div>
              <span className="font-medium">Notifications</span>
              <div className="ml-auto w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
            </Link>
            
            <button className="nav-item w-full">
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-muted-foreground group-hover:bg-surface-hover group-hover:text-foreground transition-all duration-200">
                <IoHelpCircleOutline className="w-5 h-5" />
              </div>
              <span className="font-medium">Help & Support</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 hover:border-destructive/30 focus-ring group"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-destructive/20 transition-all duration-200">
            <IoLogOutOutline className="w-5 h-5" />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}