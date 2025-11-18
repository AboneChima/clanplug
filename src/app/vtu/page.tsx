'use client';

import AppShell from '@/components/AppShell';
import VTUServices from '@/components/VTUServices';
import { IoPhonePortraitOutline } from 'react-icons/io5';

export default function VTUPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-8">
        {/* Hero Header - Dark Theme */}
        <div className="bg-slate-800/50 border-b border-slate-700 mb-4 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Airtime & Data</h1>
                <p className="text-sm text-gray-400">Buy airtime and data instantly</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-blue-400 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/30">
                <IoPhonePortraitOutline className="w-4 h-4" />
                <span className="hidden sm:inline">Instant</span>
              </div>
            </div>
          </div>
        </div>

        {/* VTU Services Component */}
        <div className="px-4">
          <VTUServices />
        </div>
      </div>
    </AppShell>
  );
}
