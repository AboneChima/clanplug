"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    const checkUnreadChats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const chats = data.data || data.chats || [];
          const unread = chats.filter((chat: any) => chat.unreadCount > 0).length;
          setUnreadChats(unread);
        }
      } catch (error) {
        console.error('Error checking unread chats:', error);
      }
    };

    checkUnreadChats();
    const interval = setInterval(checkUnreadChats, 3000); // Check every 3s for real-time updates
    
    // Also check when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkUnreadChats();
      }
    };
    
    // Check when window gains focus
    const handleFocus = () => {
      checkUnreadChats();
    };
    
    // Check when pathname changes (navigating between pages)
    checkUnreadChats();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pathname]); // Re-run when pathname changes

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] px-4 pb-safe">
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
                    {/* Unread indicator for chat - only show when there are unread messages */}
                    {href === '/chat' && unreadChats > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-500 rounded-full border border-slate-900 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white px-0.5">
                          {unreadChats > 9 ? '9+' : unreadChats}
                        </span>
                      </div>
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
