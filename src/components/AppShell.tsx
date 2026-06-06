"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, createContext, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import VTUServices from '@/components/VTUServices';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import MobileBottomNav from '@/components/MobileBottomNav';
import BroadcastOverlay from '@/components/BroadcastOverlay';
import { useToast } from '@/contexts/ToastContext';
import { 
  IoMenuOutline, 
  IoCloseOutline, 
  IoNotificationsOutline, 
  IoSearchOutline,
  IoSettingsOutline,
  IoPersonOutline,
  IoHomeOutline,
  IoLogOutOutline,
  IoGameControllerOutline,
  IoWalletOutline
} from 'react-icons/io5';

// Notification Badge Component with real-time updates
function NotificationBadge() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUnreadNotifications = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const notifications = data.data || [];
          const unread = notifications.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    checkUnreadNotifications();
    const interval = setInterval(checkUnreadNotifications, 3000); // Check every 3s for real-time
    
    // Also check when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkUnreadNotifications();
      }
    };
    
    // Check when window gains focus
    const handleFocus = () => {
      checkUnreadNotifications();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <button 
      onClick={() => router.push('/notifications')}
      className="p-2.5 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative" 
      aria-label="Notifications"
    >
      <IoNotificationsOutline className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// Create VTU Context
interface VTUContextType {
  activeVTUService: string | null;
  setActiveVTUService: (service: string | null) => void;
}

const VTUContext = createContext<VTUContextType | undefined>(undefined);

export const useVTU = () => {
  const context = useContext(VTUContext);
  if (context === undefined) {
    throw new Error('useVTU must be used within a VTUProvider');
  }
  return context;
};

type AppShellProps = {
  children: React.ReactNode;
  hideNavOnMobile?: boolean;
  hideBottomNavOnMobile?: boolean;
};

export default function AppShell({ children, hideNavOnMobile = false, hideBottomNavOnMobile = false }: AppShellProps) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeVTUService, setActiveVTUService] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'success');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 -m-20">
            <div className="absolute w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ top: '0', left: '0' }}></div>
            <div className="absolute w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ bottom: '0', right: '0', animationDelay: '1s' }}></div>
          </div>
          
          {/* Logo with gradient ring */}
          <div className="relative w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="12" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="8" r="1"/>
                <circle cx="15" cy="8" r="1"/>
                <circle cx="9" cy="12" r="1"/>
                <circle cx="15" cy="12" r="1"/>
                <path d="M8 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <VTUContext.Provider value={{ activeVTUService, setActiveVTUService }}>
      <div className="min-h-screen bg-black pb-safe">
        <header className={`sticky top-0 z-[70] bg-black border-b border-[#2f3336] ${hideNavOnMobile ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <IoCloseOutline className="w-6 h-6" />
                ) : (
                  <IoMenuOutline className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="12" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="9" cy="8" r="1"/>
                  <circle cx="15" cy="8" r="1"/>
                  <circle cx="9" cy="12" r="1"/>
                  <circle cx="15" cy="12" r="1"/>
                  <path d="M8 18h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <h1 className="text-sm font-bold text-white tracking-tight">ClanPlug</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push('/settings')}
                className="hidden lg:block p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors" 
                aria-label="Settings"
              >
                <IoSettingsOutline className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className="lg:hidden p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                aria-label="Sign out"
              >
                <IoLogOutOutline className="w-6 h-6" />
              </button>

              <NotificationBadge />
            </div>
          </div>
        </header>

        <div className="flex relative">
          <div className={`
            fixed top-0 bottom-0 left-0 z-[100] w-80 transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:top-0 lg:z-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            ${hideNavOnMobile ? 'hidden lg:block' : ''}
          `}>
            <Sidebar user={user} onLogout={handleLogout} />
          </div>

          {sidebarOpen && (
            <>
              {/* Close button overlay - visible on mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed top-4 left-[21rem] z-[110] p-2 bg-black/80 backdrop-blur-sm rounded-full text-white hover:bg-black transition-colors"
                aria-label="Close sidebar"
              >
                <IoCloseOutline className="w-6 h-6" />
              </button>
              
              {/* Background overlay */}
              <div 
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md lg:hidden transition-opacity duration-300"
                onClick={() => setSidebarOpen(false)}
              />
            </>
          )}

          <main className="flex-1 min-w-0 relative">
            <div className="min-h-[calc(100vh-3.5rem)]">
              {children}
            </div>
          </main>
        </div>

        {!hideBottomNavOnMobile && <MobileBottomNav />}
        
        <BroadcastOverlay />
      </div>
    </VTUContext.Provider>
  );
}