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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-48 lg:pb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-6 sm:py-8 mb-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <IoSettingsOutline className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Settings</h1>
                <p className="text-sm sm:text-base text-white/80">Manage your account preferences</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
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
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <IoPersonOutline className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Account Information</h2>
                    <p className="text-sm text-gray-400">Update your personal details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="First name"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Last name"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input 
                      type="email"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your.email@example.com"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <IoNotificationsOutline className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Notifications</h2>
                    <p className="text-sm text-gray-400">Manage notification preferences</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <div>
                      <div className="font-medium text-white">Email Notifications</div>
                      <div className="text-sm text-gray-400">Receive updates via email</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <div>
                      <div className="font-medium text-white">Push Notifications</div>
                      <div className="text-sm text-gray-400">Get instant notifications</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Theme - Coming Soon */}
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                    <IoInformationCircleOutline className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Appearance</h2>
                    <p className="text-sm text-gray-400">Theme customization</p>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                  <p className="text-blue-400 font-medium">🎨 Light mode coming soon!</p>
                  <p className="text-sm text-gray-400 mt-1">We're working on bringing you more theme options</p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button 
                  onClick={onSave} 
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <IoSaveOutline className="w-5 h-5" />
                      Save Changes
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
