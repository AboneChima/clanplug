"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, createContext, useContext } from 'react';
import Sidebar from '@/components/Sidebar';
import VTUServices from '@/components/VTUServices';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import MobileBottomNav from '@/components/MobileBottomNav';
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
  IoGameControllerOutline
} from 'react-icons/io5';

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
};

export default function AppShell({ children }: AppShellProps) {
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-800 rounded-full animate-spin border-t-blue-500"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-white mb-2">Loading ClanPlug</div>
            <div className="text-sm text-gray-400">Please wait while we prepare your workspace...</div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-safe">
        <header className="sticky top-0 z-[70] bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <IoCloseOutline className="w-6 h-6" />
                ) : (
                  <IoMenuOutline className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center shadow-lg">
                    <IoGameControllerOutline className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xs sm:text-sm lg:text-base font-bold text-white" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}>
                    ClanPlug
                  </h1>
                  <div className="text-[8px] sm:text-[9px] text-gray-400 -mt-0.5 hidden sm:block" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {activeVTUService ? `${activeVTUService.charAt(0).toUpperCase() + activeVTUService.slice(1)} Services` : 'Gaming Hub'}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className={`relative w-full transition-all duration-200 ${searchFocused ? 'scale-105' : ''}`}>
                <IoSearchOutline className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-2xl text-sm text-white placeholder-gray-400 transition-all duration-200 ${
                    searchFocused 
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10' 
                      : 'border-slate-700 hover:border-slate-600 focus:border-blue-500'
                  } focus:outline-none focus:shadow-lg focus:shadow-blue-500/20 focus:ring-4 focus:ring-blue-500/10`}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-gray-400">⌘K</kbd>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push('/settings')}
                className="hidden lg:block p-2.5 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" 
                aria-label="Settings"
              >
                <IoSettingsOutline className="w-5 h-5" />
              </button>

              {/* Sign Out Button - Mobile Only */}
              <button
                onClick={handleLogout}
                className="lg:hidden p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <IoLogOutOutline className="w-6 h-6" />
              </button>

              {/* Notification Icon - Top Right */}
              <button 
                onClick={() => router.push('/notifications')}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative" 
                aria-label="Notifications"
              >
                <IoNotificationsOutline className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex relative">
          <div className={`
            fixed top-16 bottom-0 left-0 z-[65] w-80 transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:top-0 lg:z-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <Sidebar user={user} onLogout={handleLogout} />
          </div>

          {sidebarOpen && (
            <div 
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md lg:hidden transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="flex-1 min-w-0 relative">
            <div className="min-h-[calc(100vh-4rem)] pb-24 lg:pb-0">
              <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </VTUContext.Provider>
  );
}