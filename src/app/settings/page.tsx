'use client';

import { useEffect, useState } from 'react';
import { IoSettingsOutline, IoPersonOutline, IoNotificationsOutline, IoSaveOutline, IoInformationCircleOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
};

export default function SettingsPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    if (user) {
      setProfile({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar,
      });
    }
  }, [user]);

  const onSave = async () => {
    if (!accessToken || !profile) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          email: profile.email,
        }),
      });

      if (response.ok) {
        showToast('Settings saved successfully', 'success');
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to save settings', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-2.5 xs:py-3 sm:py-4 md:py-6 mb-3 xs:mb-4 sm:mb-6">
          <div className="max-w-4xl mx-auto px-2.5 xs:px-3 sm:px-4 md:px-6">
            <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
              <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg xs:rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <IoSettingsOutline className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-0.5">Settings</h1>
                <p className="text-[10px] xs:text-xs sm:text-sm md:text-base text-white/80">Manage your account</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-2.5 xs:px-3 sm:px-4 md:px-6 space-y-2.5 xs:space-y-3 sm:space-y-4 md:space-y-6">
          {!profile ? (
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-12 text-center">
              <IoSettingsOutline className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {accessToken ? 'Loading Settings' : 'Please Log In'}
              </h3>
              <p className="text-gray-400">
                {accessToken ? 'Please wait...' : 'Log in to access your settings'}
              </p>
            </div>
          ) : (
            <>
              {/* Account Settings */}
              <div className="bg-slate-800/50 rounded-lg xs:rounded-xl sm:rounded-2xl border border-slate-700 p-2.5 xs:p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4 md:mb-6">
                  <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md xs:rounded-lg sm:rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <IoPersonOutline className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white">Account Info</h2>
                    <p className="text-[10px] xs:text-xs sm:text-sm text-gray-400">Update details</p>
                  </div>
                </div>

                <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
                    <div>
                      <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 mb-1 xs:mb-1.5 sm:mb-2">First Name</label>
                      <input 
                        type="text"
                        className="w-full px-2 xs:px-2.5 sm:px-3 md:px-4 py-1.5 xs:py-2 sm:py-2.5 md:py-3 bg-slate-700/50 border border-slate-600 rounded-md xs:rounded-lg text-white text-xs xs:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="First name"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 mb-1 xs:mb-1.5 sm:mb-2">Last Name</label>
                      <input 
                        type="text"
                        className="w-full px-2 xs:px-2.5 sm:px-3 md:px-4 py-1.5 xs:py-2 sm:py-2.5 md:py-3 bg-slate-700/50 border border-slate-600 rounded-md xs:rounded-lg text-white text-xs xs:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Last name"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 mb-1 xs:mb-1.5 sm:mb-2">Username</label>
                    <input 
                      type="text"
                      className="w-full px-2 xs:px-2.5 sm:px-3 md:px-4 py-1.5 xs:py-2 sm:py-2.5 md:py-3 bg-slate-700/50 border border-slate-600 rounded-md xs:rounded-lg text-white text-xs xs:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })} 
                    />
                    <p className="text-[9px] xs:text-[10px] text-gray-400 mt-1">Can be changed once every 30 days</p>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-300 mb-1 xs:mb-1.5 sm:mb-2">Email</label>
                    <input 
                      type="email"
                      className="w-full px-2 xs:px-2.5 sm:px-3 md:px-4 py-1.5 xs:py-2 sm:py-2.5 md:py-3 bg-slate-700/50 border border-slate-600 rounded-md xs:rounded-lg text-white text-xs xs:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your.email@example.com"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                    />
                    <p className="text-[9px] xs:text-[10px] text-gray-400 mt-1">Can be changed once every 30 days</p>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-slate-800/50 rounded-lg xs:rounded-xl sm:rounded-2xl border border-slate-700 p-2.5 xs:p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4 md:mb-6">
                  <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md xs:rounded-lg sm:rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <IoNotificationsOutline className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white">Notifications</h2>
                    <p className="text-[10px] xs:text-xs sm:text-sm text-gray-400">Manage preferences</p>
                  </div>
                </div>

                <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-4">
                  <label className="flex items-center justify-between p-2 xs:p-2.5 sm:p-3 md:p-4 bg-slate-700/30 rounded-md xs:rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <div>
                      <div className="text-xs xs:text-sm font-medium text-white">Email Notifications</div>
                      <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400">Receive updates via email</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 xs:p-2.5 sm:p-3 md:p-4 bg-slate-700/30 rounded-md xs:rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <div>
                      <div className="text-xs xs:text-sm font-medium text-white">Push Notifications</div>
                      <div className="text-[10px] xs:text-xs sm:text-sm text-gray-400">Get instant notifications</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Theme - Coming Soon */}
              <div className="bg-slate-800/50 rounded-lg xs:rounded-xl sm:rounded-2xl border border-slate-700 p-2.5 xs:p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 mb-2 xs:mb-2.5 sm:mb-3 md:mb-4">
                  <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md xs:rounded-lg sm:rounded-xl bg-indigo-600/20 flex items-center justify-center">
                    <IoInformationCircleOutline className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white">Appearance</h2>
                    <p className="text-[10px] xs:text-xs sm:text-sm text-gray-400">Theme options</p>
                  </div>
                </div>
                
                <div className="p-2 xs:p-2.5 sm:p-3 md:p-4 bg-blue-600/10 border border-blue-600/30 rounded-md xs:rounded-lg">
                  <p className="text-blue-400 text-xs xs:text-sm font-medium">🎨 Light mode coming soon!</p>
                  <p className="text-[10px] xs:text-xs sm:text-sm text-gray-400 mt-0.5 xs:mt-1">More theme options</p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button 
                  onClick={onSave} 
                  disabled={saving}
                  className="px-4 xs:px-5 sm:px-6 md:px-8 py-1.5 xs:py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white text-xs xs:text-sm sm:text-base font-semibold rounded-lg xs:rounded-xl transition-all flex items-center gap-1.5 xs:gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="hidden xs:inline">Saving...</span>
                      <span className="xs:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <IoSaveOutline className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                      <span className="hidden xs:inline">Save Changes</span>
                      <span className="xs:hidden">Save</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
