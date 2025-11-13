"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  IoGridOutline, 
  IoWalletOutline, 
  IoPhonePortraitOutline,
  IoPersonOutline,
  IoGrid
} from 'react-icons/io5';

const navItems = [
  { 
    href: '/dashboard', 
    label: 'Home', 
    Icon: IoGridOutline,
    ActiveIcon: IoGrid
  },
  { 
    href: '/wallet', 
    label: 'Wallet', 
    Icon: IoWalletOutline,
    ActiveIcon: IoWalletOutline
  },
  { 
    href: '/vtu', 
    label: 'VTU', 
    Icon: IoPhonePortraitOutline,
    ActiveIcon: IoPhonePortraitOutline
  },
  { 
    href: '/profile', 
    label: 'Profile', 
    Icon: IoPersonOutline,
    ActiveIcon: IoPersonOutline
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-800 border-t border-gray-700/50 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 py-3 safe-area-bottom">
        {navItems.map(({ href, label, Icon, ActiveIcon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
          const IconComponent = active ? ActiveIcon : Icon;

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 relative group"
            >
              {active && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-sm"></div>
              )}
              <div className={`relative transition-all duration-300 ${
                active 
                  ? 'scale-110 text-blue-400' 
                  : 'text-gray-400 group-hover:text-gray-300 group-hover:scale-105'
              }`}>
                <IconComponent className="w-6 h-6" />
                {active && (
                  <>
                    <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-full blur-md"></div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                  </>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 relative ${
                active 
                  ? 'text-blue-400 font-semibold' 
                  : 'text-gray-400 group-hover:text-gray-300'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
