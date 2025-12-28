'use client';

import { useEffect, useState } from 'react';
import { 
  IoSettingsOutline, 
  IoPersonOutline, 
  IoNotificationsOutline, 
  IoSaveOutline, 
  IoDocumentTextOutline,
  IoHelpCircleOutline,
  IoChatbubbleEllipsesOutline,
  IoSendOutline,
  IoCloseOutline
} from 'react-icons/io5';
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
  const [showTerms, setShowTerms] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpLoading, setHelpLoading] = useState(false);

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

  const handleHelpSubmit = async () => {
    if (!helpMessage.trim()) return;
    
    setHelpLoading(true);
    // Simulate AI response
    setTimeout(() => {
      showToast('Our support team will get back to you shortly!', 'success');
      setHelpMessage('');
      setHelpLoading(false);
      setShowHelp(false);
    }, 1500);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8">
        {/* Header with Verification Badge */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-2.5 xs:py-3 sm:py-4 md:py-6 mb-3 xs:mb-4 sm:mb-6">
          <div className="max-w-4xl mx-auto px-2.5 xs:px-3 sm:px-4 md:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg xs:rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <IoSettingsOutline className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">Settings</h1>
                    {(user?.verificationBadge?.status === 'verified' || user?.verificationBadge?.status === 'active') && (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[10px] xs:text-xs sm:text-sm md:text-base text-white/80">Manage your account</p>
                </div>
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

              {/* Terms & Conditions and Help Support */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4">
                {/* Terms & Conditions */}
                <button
                  onClick={() => setShowTerms(true)}
                  className="bg-slate-800/50 rounded-lg xs:rounded-xl border border-slate-700 p-3 xs:p-4 hover:bg-slate-700/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 xs:gap-3 mb-2">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg bg-green-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IoDocumentTextOutline className="w-5 h-5 xs:w-6 xs:h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-sm xs:text-base font-bold text-white">Terms & Conditions</h3>
                      <p className="text-[10px] xs:text-xs text-gray-400">Read our terms</p>
                    </div>
                  </div>
                </button>

                {/* Help & Support */}
                <button
                  onClick={() => setShowHelp(true)}
                  className="bg-slate-800/50 rounded-lg xs:rounded-xl border border-slate-700 p-3 xs:p-4 hover:bg-slate-700/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 xs:gap-3 mb-2">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg bg-orange-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IoHelpCircleOutline className="w-5 h-5 xs:w-6 xs:h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-sm xs:text-base font-bold text-white">Help & Support</h3>
                      <p className="text-[10px] xs:text-xs text-gray-400">Get assistance</p>
                    </div>
                  </div>
                </button>
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

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowTerms(false)}>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Terms & Conditions</h2>
              <button onClick={() => setShowTerms(false)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <IoCloseOutline className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)] text-gray-300 text-sm space-y-4">
              <p className="font-semibold text-white">Last Updated: December 2024</p>
              
              <div>
                <h3 className="font-semibold text-white mb-2">1. Acceptance of Terms</h3>
                <p>By accessing and using ClanPlug, you accept and agree to be bound by the terms and provision of this agreement.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">2. Use License</h3>
                <p>Permission is granted to temporarily use ClanPlug for personal, non-commercial transitory viewing only.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">3. User Account</h3>
                <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">4. Prohibited Activities</h3>
                <p>You may not use ClanPlug for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">5. Transactions</h3>
                <p>All transactions are final. Refunds are subject to our refund policy. We reserve the right to refuse service to anyone for any reason at any time.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">6. Privacy</h3>
                <p>Your privacy is important to us. We collect and use your information in accordance with our Privacy Policy.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">7. Modifications</h3>
                <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">8. Contact</h3>
                <p>For questions about these Terms, please contact our support team.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal - AI Assistant Style */}
      {showHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <IoChatbubbleEllipsesOutline className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Help & Support</h2>
                  <p className="text-xs text-gray-400">We're here to help!</p>
                </div>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <IoCloseOutline className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-600/10 border border-blue-600/30 rounded-xl">
                <p className="text-sm text-blue-400 mb-2">👋 Hi! How can we help you today?</p>
                <p className="text-xs text-gray-400">Our support team typically responds within 24 hours.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Message</label>
                  <textarea
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  onClick={handleHelpSubmit}
                  disabled={!helpMessage.trim() || helpLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {helpLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <IoSendOutline className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-gray-400 text-center">
                  Need immediate help? Email us at{' '}
                  <a href="mailto:support@clanplug.com" className="text-blue-400 hover:underline">
                    support@clanplug.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
