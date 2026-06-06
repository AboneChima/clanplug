'use client';

import { IoArrowBack, IoChevronForward, IoPersonOutline, IoLockClosedOutline, IoNotificationsOutline, IoMoonOutline, IoInformationCircleOutline, IoHelpCircleOutline, IoTrashOutline } from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <AppShell>
      <div className="-m-4 sm:-m-6 lg:-m-8 min-h-screen bg-black">
        {/* Header */}
        <div className="bg-[#1a1a1a] border-b border-[#333]">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <IoArrowBack className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-white text-lg font-semibold">Settings</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.username} width={60} height={60} className="w-15 h-15 rounded-full" />
              ) : (
                <div className="w-15 h-15 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{user?.firstName?.[0]}</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-white font-semibold">{user?.firstName} {user?.lastName}</h2>
                <p className="text-gray-400 text-sm">@{user?.username}</p>
              </div>
              <IoChevronForward className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          {/* Other Settings */}
          <h3 className="text-gray-400 text-sm font-medium mb-3 px-2">Other settings</h3>
          
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden mb-6">
            <button onClick={() => router.push('/profile')} className="w-full flex items-center gap-3 p-4 hover:bg-[#252525] transition-colors border-b border-[#333]">
              <IoPersonOutline className="w-5 h-5 text-white" />
              <span className="flex-1 text-left text-white">Profile details</span>
              <IoChevronForward className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center gap-3 p-4 hover:bg-[#252525] transition-colors border-b border-[#333]">
              <IoLockClosedOutline className="w-5 h-5 text-white" />
              <span className="flex-1 text-left text-white">Password</span>
              <IoChevronForward className="w-5 h-5 text-gray-500" />
            </button>

            <button onClick={() => router.push('/notifications')} className="w-full flex items-center gap-3 p-4 hover:bg-[#252525] transition-colors border-b border-[#333]">
              <IoNotificationsOutline className="w-5 h-5 text-white" />
              <span className="flex-1 text-left text-white">Notifications</span>
              <IoChevronForward className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-3 p-4">
              <IoMoonOutline className="w-5 h-5 text-white" />
              <span className="flex-1 text-left text-white">Dark mode</span>
              <div className="w-12 h-7 bg-blue-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden mb-6">
            <button className="w-full flex items-center gap-3 p-4 hover:bg-[#252525] transition-colors border-b border-[#333]">
              <IoInformationCircleOutline className="w-5 h-5 text-white" />
              <span className="flex-1 text-left text-white">About application</span>
              <IoChevronForward className="w-5 h-5 text-gray-500" />
            </button>

            <button onClick={() => router.push('/help')} className="w-full flex items-center gap-3 p-4 hover:bg-[#252525] transition-colors border-b border-[#333]">
              <IoHelpCircleOutline className="w-5 h-5 text-white" />
              <span className="flex-1 text-left text-white">Help/FAQ</span>
              <IoChevronForward className="w-5 h-5 text-gray-500" />
            </button>

            <button className="w-full flex items-center gap-3 p-4 hover:bg-[#252525] transition-colors">
              <IoTrashOutline className="w-5 h-5 text-red-500" />
              <span className="flex-1 text-left text-red-500">Deactivate my account</span>
              <IoChevronForward className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
