"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  IoGridOutline,
  IoPersonOutline,
  IoDocumentTextOutline,
  IoShieldCheckmarkOutline,
  IoWalletOutline,
  IoPhonePortraitOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoStatsChartOutline,
  IoSettingsOutline,
  IoPeopleOutline,
  IoNotificationsOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', Icon: IoGridOutline },
  { href: '/admin/users', label: 'Users', Icon: IoPersonOutline },
  { href: '/admin/listings', label: 'Listings', Icon: IoDocumentTextOutline },
  { href: '/admin/escrow', label: 'Escrow', Icon: IoShieldCheckmarkOutline },
  { href: '/admin/wallet', label: 'Wallet & Transactions', Icon: IoWalletOutline },
  { href: '/admin/vtu', label: 'VTU Management', Icon: IoPhonePortraitOutline },
  { href: '/admin/disputes', label: 'Disputes', Icon: IoWarningOutline },
  { href: '/admin/kyc', label: 'KYC Verification', Icon: IoCheckmarkCircleOutline },
  { href: '/admin/notifications', label: 'Notifications', Icon: IoNotificationsOutline },
  { href: '/admin/analytics', label: 'Analytics', Icon: IoStatsChartOutline },
  { href: '/admin/settings', label: 'Settings', Icon: IoSettingsOutline },
  { href: '/admin/roles', label: 'Admin Roles', Icon: IoPeopleOutline },
];

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={`fixed left-0 top-0 h-full bg-surface border-r border-border transition-all duration-300 z-40 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LM</span>
            </div>
            <div>
              <h2 className="font-bold text-foreground">Lordmoon</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-background rounded-lg transition-colors"
        >
          {collapsed ? (
            <IoChevronForwardOutline className="w-4 h-4 text-muted-foreground" />
          ) : (
            <IoChevronBackOutline className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {adminNavItems.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname?.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                  ${active 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'text-muted-foreground hover:bg-background hover:text-foreground'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
                {active && !collapsed && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <p>Lordmoon Admin v1.0</p>
            <p className="mt-1">© 2024 All rights reserved</p>
          </div>
        </div>
      )}
    </div>
  );
}