'use client';

import { useRouter } from 'next/navigation';
import { IoBanOutline, IoArrowBack, IoMailOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';

export default function BannedUserPage() {
  const router = useRouter();

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-red-500/30 p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/40">
                  <IoBanOutline className="w-12 h-12 text-red-400" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white text-center mb-2">
                Account Suspended
              </h1>
              <p className="text-gray-400 text-center text-sm">
                This user's account is currently unavailable
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  The profile you're trying to view belongs to an account that has been suspended 
                  due to violations of our community guidelines or terms of service.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <IoMailOutline className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white mb-1">Have Questions?</p>
                    <p className="text-gray-400 text-xs">
                      If you believe this is an error, please contact our support team at{' '}
                      <a 
                        href="mailto:admin@clanplug.site" 
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        admin@clanplug.site
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-700">
                <button
                  onClick={() => router.push('/feed')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <IoArrowBack className="w-5 h-5" />
                  <span>Back to Feed</span>
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Suspended accounts cannot be viewed or interacted with
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
