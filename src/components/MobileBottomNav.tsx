"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  IoHomeOutline,
  IoHome,
  IoChatbubbleOutline,
  IoChatbubble,
  IoStorefrontOutline,
  IoStorefront,
  IoPersonOutline,
  IoPerson,
  IoEllipsisHorizontal,
  IoNotificationsOutline,
  IoNotifications
} from 'react-icons/io5';

const navItems = [
  { 
    href: '/feed', 
    label: 'Home', 
    Icon: IoHomeOutline,
    ActiveIcon: IoHome
  },
  { 
    href: '/chat', 
    label: 'Chat', 
    Icon: IoChatbubbleOutline,
    ActiveIcon: IoChatbubble
  },
  { 
    href: '/posts', 
    label: 'Shop', 
    Icon: IoStorefrontOutline,
    ActiveIcon: IoStorefront
  },
  { 
    href: '/profile', 
    label: 'Profile', 
    Icon: IoPersonOutline,
    ActiveIcon: IoPerson
  },
  { 
    href: '/more', 
    label: 'More', 
    Icon: IoEllipsisHorizontal,
    ActiveIcon: IoEllipsisHorizontal
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe">
      <div className="mx-auto max-w-md mb-4">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-[28px] shadow-2xl shadow-black/40">
          <div className="flex items-center justify-around px-2 py-3">
            {navItems.map(({ href, label, Icon, ActiveIcon }) => {
              const active = pathname === href || (href !== '/feed' && href !== '/more' && pathname?.startsWith(href));
              const IconComponent = active ? ActiveIcon : Icon;

              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 min-w-[64px]"
                >
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm"></div>
                  )}
                  <div className={`relative transition-all duration-300 ${
                    active 
                      ? 'text-blue-400 scale-110' 
                      : 'text-gray-400'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                    {active && (
                      <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-md"></div>
                    )}
                  </div>
                  <span className={`relative text-[10px] font-semibold transition-all duration-300 ${
                    active 
                      ? 'text-blue-400' 
                      : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
