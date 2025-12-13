"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed (closed) on mobile
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is logged in and is admin
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }

      if (!user) {
        // Wait for user to load
        setTimeout(() => setLoading(false), 1000);
        return;
      }

      // Check if user is admin
      if (user.role !== 'ADMIN') {
        alert('Access denied. Admin privileges required.');
        router.push('/feed');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [user, router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  const adminUserForTopbar = {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: 'Admin',
    avatar: user.avatar || null
  };

  return (
    <div className="h-screen bg-slate-950 overflow-hidden flex">
      {/* Mobile Sidebar Backdrop */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Admin Sidebar - Fixed, overlay on mobile, always visible on desktop */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:transform-none ${
        sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
      }`}>
        <AdminSidebar 
          collapsed={false}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Admin Topbar - Fixed */}
        <AdminTopbar 
          user={adminUserForTopbar}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}