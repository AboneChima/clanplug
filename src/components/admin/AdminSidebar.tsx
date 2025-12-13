"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IoGridOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoLogOutOutline,
} from 'react-icons/io5';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: IoGridOutline },
  { href: '/admin/users', label: 'Users', icon: IoPersonOutline },
  { href: '/admin/kyc', label: 'KYC Verification', icon: IoShieldCheckmarkOutline },
];

export default function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-slate-800 flex-shrink-0">
        <span className="text-lg sm:text-xl font-bold text-white">Admin Panel</span>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout - Fixed at bottom */}
      <div className="p-3 border-t border-slate-800 flex-shrink-0">
        <button
          onClick={() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors w-full"
        >
          <IoLogOutOutline className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
