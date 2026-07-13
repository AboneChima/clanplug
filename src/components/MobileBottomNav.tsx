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
  IoEllipsisHorizontal
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
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUnreadMessages = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const chats = data.data || [];
          const totalUnread = chats.reduce((sum: number, chat: any) => sum + (chat.unreadCount || 0), 0);
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error checking messages:', error);
      }
    };

    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[50] bg-black border-t border-[#2f3336]">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map(({ href, label, Icon, ActiveIcon }) => {
          const active = pathname === href || (href !== '/feed' && href !== '/more' && pathname?.startsWith(href));
          const IconComponent = active ? ActiveIcon : Icon;
          const isChat = href === '/chat';

          return (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col items-center justify-center p-2 transition-all duration-200 active:scale-95"
            >
              {/* Icon with smooth transition */}
              <div className="relative">
                <IconComponent className={`w-6 h-6 transition-all duration-200 ${
                  active ? 'text-white scale-110' : 'text-gray-500 group-hover:text-gray-300 group-hover:scale-105'
                }`} />
                
                {/* Unread badge for chat */}
                {isChat && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                
                {/* Active indicator dot */}
                {active && !isChat && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
