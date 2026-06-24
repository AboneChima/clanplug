'use client';

import { useEffect, useState } from 'react';
import { IoChevronForwardOutline, IoPersonOutline, IoLockClosedOutline, IoNotificationsOutline, IoMoonOutline, IoInformationCircleOutline, IoChatbubbleOutline, IoTrashOutline, IoArrowBackOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
};

export default function SettingsPage() {
  const { user, accessToken, updateUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Nigerian cities and states
  const nigerianLocations = [
    'Lagos, Nigeria', 'Abuja, Nigeria', 'Kano, Nigeria', 'Ibadan, Nigeria', 'Port Harcourt, Nigeria',
    'Benin City, Nigeria', 'Kaduna, Nigeria', 'Enugu, Nigeria', 'Aba, Nigeria', 'Jos, Nigeria',
    'Ilorin, Nigeria', 'Oyo, Nigeria', 'Abeokuta, Nigeria', 'Warri, Nigeria', 'Calabar, Nigeria',
    'Owerri, Nigeria', 'Uyo, Nigeria', 'Sokoto, Nigeria', 'Maiduguri, Nigeria', 'Akure, Nigeria',
    'Bauchi, Nigeria', 'Awka, Nigeria', 'Asaba, Nigeria', 'Yola, Nigeria', 'Makurdi, Nigeria',
    'Osogbo, Nigeria', 'Gombe, Nigeria', 'Umuahia, Nigeria', 'Lokoja, Nigeria', 'Damaturu, Nigeria',
    'Minna, Nigeria', 'Ado-Ekiti, Nigeria', 'Lafia, Nigeria', 'Jalingo, Nigeria', 'Gusau, Nigeria',
    'Dutse, Nigeria', 'Birnin Kebbi, Nigeria', 'Abakaliki, Nigeria', 'Yenagoa, Nigeria',
  ];

  const handleLocationChange = (value: string) => {
    if (profile) {
      setProfile({ ...profile, location: value });
    }
    if (value.length > 0) {
      const filtered = nigerianLocations.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setLocationSuggestions(filtered.slice(0, 5));
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const selectLocation = (location: string) => {
    if (profile) {
      setProfile({ ...profile, location });
    }
    setShowLocationSuggestions(false);
  };

  const detectLocation = () => {
    if (!profile) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get city name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
            );
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.state;
            if (city && profile) {
              setProfile({ ...profile, location: `${city}, Nigeria` });
              showToast('Location detected!', 'success');
            }
          } catch (error) {
            showToast('Could not detect city', 'error');
          }
        },
        () => {
          showToast('Location access denied', 'error');
        }
      );
    } else {
      showToast('Geolocation not supported', 'error');
    }
  };

  useEffect(() => {
    if (user) {
      setProfile({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar,
        phone: user.phone || '',
        location: (user as any).location || user.city || '',
        bio: user.bio || '',
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      let avatarUrl = profile.avatar;
      
      // Step 1: Upload avatar FIRST if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          console.log('Avatar upload response:', data);
          avatarUrl = data.user?.avatar || data.avatar || data.data?.url;
        } else {
          const error = await uploadRes.json();
          console.error('Avatar upload failed:', error);
          showToast(error.message || 'Failed to upload avatar', 'error');
        }
      }
      
      // Step 2: Update profile data (without avatar)
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
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile update response:', data);
        
        // Update user context with new data
        const updatedUser = {
          ...profile,
          avatar: avatarUrl ? `${avatarUrl}?t=${Date.now()}` : profile.avatar,
        };
        
        updateUser(updatedUser);
        setAvatarPreview(updatedUser.avatar || '');
        showToast('Profile updated successfully!', 'success');
        setShowProfileEdit(false);
        setAvatarFile(null);
      } else {
        const error = await response.json();
        console.error('Profile update failed:', error);
        showToast(error.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getUserInitials = () => {
    if (profile?.firstName) {
      return profile.firstName[0].toUpperCase();
    }
    return (profile?.username?.[0] || 'U').toUpperCase();
  };

  return (
    <AppShell hideBottomNavOnMobile={true}>
      <div className="min-h-screen bg-black pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-[#2f3336] px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors lg:hidden">
            <IoArrowBackOutline className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {!profile ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <button 
                onClick={() => setShowProfileEdit(true)}
                className="bg-[#2a2a2a] rounded-2xl p-4 flex items-center gap-4 w-full hover:bg-[#333] transition-colors"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-blue-500 to-slate-700">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black p-0.5">
                      {avatarPreview ? (
                        <Image src={avatarPreview} alt={profile.username} width={56} height={56} className="w-full h-full rounded-full object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#3a3a3a] flex items-center justify-center">
                          <span className="text-white text-xl font-bold">{getUserInitials()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-white font-semibold text-base">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-gray-500 text-sm">@{profile.username}</p>
                </div>
                <IoChevronForwardOutline className="w-5 h-5 text-gray-600" />
              </button>

              {/* Other Settings Label */}
              <div className="px-2 pt-2">
                <h3 className="text-gray-600 text-sm font-medium">Other settings</h3>
              </div>

              {/* Settings Group 1 */}
              <div className="bg-[#2a2a2a] rounded-2xl overflow-hidden">
                <button 
                  onClick={() => router.push('/kyc')}
                  className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#333] transition-colors border-b border-[#3a3a3a]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <IoShieldCheckmarkOutline className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-white text-sm font-medium">KYC Verification</span>
                    <p className="text-gray-500 text-xs">
                      {user?.isKYCVerified ? 'Verified ✓' : 'Verify your identity'}
                    </p>
                  </div>
                  <IoChevronForwardOutline className="w-5 h-5 text-gray-600" />
                </button>

                <button 
                  onClick={() => router.push('/verification-badge')}
                  className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#333] transition-colors border-b border-[#3a3a3a]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <IoShieldCheckmarkOutline className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-white text-sm font-medium">Premium Verification</span>
                    <p className="text-gray-500 text-xs">Get the blue checkmark</p>
                  </div>
                  <IoChevronForwardOutline className="w-5 h-5 text-gray-600" />
                </button>

                <button 
                  onClick={() => router.push('/notifications')}
                  className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#333] transition-colors border-b border-[#3a3a3a]"
                >
                  <div className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <IoNotificationsOutline className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left text-white text-sm">Notifications</span>
                  <IoChevronForwardOutline className="w-5 h-5 text-gray-600" />
                </button>

                <div className="w-full px-4 py-4 flex items-center gap-3 border-b border-[#3a3a3a]">
                  <div className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <IoMoonOutline className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left text-white text-sm">Dark mode</span>
                  <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
                    <span className="text-xs text-blue-400">Coming Soon</span>
                  </div>
                </div>
              </div>

              {/* Settings Group 2 */}
              <div className="bg-[#2a2a2a] rounded-2xl overflow-hidden">
                <button className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#333] transition-colors border-b border-[#3a3a3a]">
                  <div className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <IoInformationCircleOutline className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left text-white text-sm">About application</span>
                  <IoChevronForwardOutline className="w-5 h-5 text-gray-600" />
                </button>

                <button 
                  onClick={() => router.push('/help')}
                  className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#333] transition-colors border-b border-[#3a3a3a]"
                >
                  <div className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <IoChatbubbleOutline className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 text-left text-white text-sm">Help/FAQ</span>
                  <IoChevronForwardOutline className="w-5 h-5 text-gray-600" />
                </button>

                <button className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#333] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <IoTrashOutline className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="flex-1 text-left text-red-500 text-sm">Deactivate my account</span>
                  <div className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
                    <span className="text-xs text-red-400">Coming Soon</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Profile Edit Modal */}
        {showProfileEdit && profile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2f3336] max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-[#2f3336] flex-shrink-0">
                <h2 className="text-lg font-bold text-white">Edit Profile</h2>
              </div>
              
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-blue-500 to-slate-700">
                      <div className="w-full h-full rounded-full overflow-hidden bg-black p-0.5">
                        {avatarPreview ? (
                          <Image src={avatarPreview} alt="Avatar" width={64} height={64} className="w-full h-full rounded-full object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#3a3a3a] flex items-center justify-center">
                            <span className="text-white text-lg font-bold">{getUserInitials()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg cursor-pointer transition-colors">
                    Change Photo
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>

                {/* Form Fields - Smaller */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={2}
                    maxLength={150}
                    className="w-full px-2.5 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">{profile.bio?.length || 0}/150 characters</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                    className="w-full px-2.5 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs text-gray-400 mb-1">Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onFocus={() => profile.location && setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                      placeholder="Start typing city name..."
                      className="flex-1 px-2.5 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={detectLocation}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors whitespace-nowrap"
                    >
                      📍 Detect
                    </button>
                  </div>
                  {showLocationSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg shadow-xl max-h-40 overflow-y-auto">
                      {locationSuggestions.map((loc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectLocation(loc)}
                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#2a2a2a] transition-colors"
                        >
                          📍 {loc}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 border-t border-[#2f3336] flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowProfileEdit(false);
                    setAvatarFile(null);
                    setAvatarPreview(user?.avatar || '');
                  }}
                  className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
