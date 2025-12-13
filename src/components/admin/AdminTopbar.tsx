"use client";

import { IoMenuOutline, IoLogOutOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

interface AdminTopbarProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  onToggleSidebar: () => void;
}

export default function AdminTopbar({ user, onToggleSidebar }: AdminTopbarProps) {
  const router = useRouter();

  const handleSignOut = () => {
    // Clear all auth tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirect to login
    router.push('/login');
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
      >
        <IoMenuOutline className="w-6 h-6 text-gray-400" />
      </button>

      <div className="flex items-center gap-3 ml-auto">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="ml-4 p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors flex items-center gap-2"
          title="Sign Out"
        >
          <IoLogOutOutline className="w-5 h-5" />
          <span className="hidden sm:inline text-sm">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
