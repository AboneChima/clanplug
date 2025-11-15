"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to admin panel since login is no longer required
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20">
          <div className="text-2xl font-bold text-white tracking-tight">CP</div>
        </div>
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-300">Redirecting to admin panel...</p>
        <p className="text-gray-500 text-sm mt-2">Login is no longer required</p>
      </div>
    </div>
  );
}