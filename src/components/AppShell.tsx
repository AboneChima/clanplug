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
  IoHomeOutline
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
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-surface rounded-full animate-spin border-t-brand-500"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-brand-200/20 rounded-full"></div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-base-foreground mb-2">Loading Lordmoon</div>
            <div className="text-sm text-muted-foreground">Please wait while we prepare your workspace...</div>
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
      <div className="min-h-screen bg-base">
        <header className="sticky top-0 z-50 glass-surface border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden nav-item p-2"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <IoCloseOutline className="w-6 h-6" />
                ) : (
                  <IoMenuOutline className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand">
                    <IoHomeOutline className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute inset-0 w-10 h-10 rounded-2xl bg-brand-gradient opacity-20 blur-md"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-base-foreground">
                    {activeVTUService ? `VTU Services` : 'Dashboard'}
                  </h1>
                  <div className="text-xs text-muted-foreground -mt-1">
                    {activeVTUService ? `${activeVTUService.charAt(0).toUpperCase() + activeVTUService.slice(1)} Services` : 'Welcome back'}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className={`relative w-full transition-all duration-200 ${searchFocused ? 'scale-105' : ''}`}>
                <IoSearchOutline className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className={`w-full pl-12 pr-4 py-3 bg-surface border rounded-2xl text-sm text-base-foreground placeholder-muted-foreground transition-all duration-200 ${
                    searchFocused 
                      ? 'border-brand-400 shadow-brand ring-4 ring-brand-100' 
                      : 'border-border hover:border-border-light focus:border-brand-400'
                  } focus:outline-none focus:shadow-brand focus:ring-4 focus:ring-brand-100`}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs bg-muted border border-border rounded text-muted-foreground">⌘K</kbd>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1">
                <button className="nav-item p-2.5" aria-label="Settings">
                  <IoSettingsOutline className="w-5 h-5" />
                </button>
                
                <NotificationCenter />
              </div>

              <div className="flex items-center gap-3 ml-3 pl-3 border-l border-border">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-base-foreground">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                  </p>
                  <div className="flex items-center gap-2 -mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <button className="relative group">
                  {user.avatar ? (
                    <>
                      <img 
                        src={user.avatar} 
                        alt={user.username || 'User'} 
                        className="w-11 h-11 rounded-2xl object-cover shadow-brand transition-all duration-200 group-hover:scale-105 group-hover:shadow-brand-lg"
                      />
                      <div className="absolute inset-0 w-11 h-11 rounded-2xl bg-brand-gradient opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-200"></div>
                    </>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-2xl bg-brand-gradient flex items-center justify-center text-sm font-bold text-white shadow-brand transition-all duration-200 group-hover:scale-105 group-hover:shadow-brand-lg">
                        {user.firstName && user.lastName ? (
                          `${user.firstName[0]}${user.lastName[0]}`
                        ) : (
                          (user.firstName?.[0] || user.lastName?.[0] || user.username?.[0] || 'U').toUpperCase()
                        )}
                      </div>
                      <div className="absolute inset-0 w-11 h-11 rounded-2xl bg-brand-gradient opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-200"></div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          <div className={`
            fixed top-16 bottom-0 left-0 z-40 w-80 transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:top-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <Sidebar user={user} onLogout={handleLogout} />
          </div>

          {sidebarOpen && (
            <div 
              className="fixed inset-0 z-30 bg-base/60 backdrop-blur-md lg:hidden transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="flex-1 min-w-0 relative">
            <div className="min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">
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