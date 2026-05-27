'use client';

// Clean minimal profile - v2.0
import { useState, useEffect } from 'react';
import { IoSettingsOutline, IoImageOutline, IoCreateOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

interface UserStats {
  posts: number;
  followers: number;
  following: number;
}

export default function ProfilePage() {
  const { user, updateUser, refetchUser } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<UserStats>({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    refetchUser();
  }, []);

  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      // Load user posts
      let postsCount = 0;
      try {
        const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          const posts = Array.isArray(postsData.data) ? postsData.data : [];
          postsCount = posts.length;
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
      
      // Load follow stats
      let followersCount = 0;
      let followingCount = 0;
      
      try {
        const followResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${user.id}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (followResponse.ok) {
          const followData = await followResponse.json();
          followersCount = followData.followers || followData.data?.followers || 0;
          followingCount = followData.following || followData.data?.following || 0;
        }
      } catch (err) {
        console.error('Error fetching follow stats:', err);
      }
      
      setStats({
        posts: postsCount,
        followers: followersCount,
        following: followingCount,
      });
      
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const newAvatarUrl = data.user?.avatar || data.avatar;
        
        if (newAvatarUrl) {
          const timestampedUrl = `${newAvatarUrl}?t=${Date.now()}`;
          updateUser({ avatar: timestampedUrl });
          setAvatarPreview(timestampedUrl);
          showToast('Profile picture updated!', 'success');
          setTimeout(() => window.location.reload(), 500);
        }
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to update profile picture', 'error');
        setAvatarPreview(user?.avatar || '');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile picture', 'error');
      setAvatarPreview(user?.avatar || '');
    } finally {
      setIsUploading(false);
    }
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return (user?.username?.[0] || 'U').toUpperCase();
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24 lg:pb-8">
        <div className="max-w-md mx-auto px-4 pt-6">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Profil</h1>
            <Link href="/settings">
              <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <IoSettingsOutline className="w-6 h-6 text-slate-700" />
              </button>
            </Link>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-4">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-white shadow-lg">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={user?.username || 'User'}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                      {getUserInitials()}
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 hover:bg-slate-800 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all"
                >
                  <IoCreateOutline className="w-4 h-4 text-white" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

              {/* Name and Username */}
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-slate-500 mb-3">@{user?.username}</p>

              {/* Premium Badge (if verified) */}
              {user?.isKYCVerified && (
                <div className="px-4 py-1 bg-slate-900 rounded-full flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">Premium</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.posts}</p>
                <p className="text-xs text-slate-500">Gönder</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.followers}</p>
                <p className="text-xs text-slate-500">Takipçi</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.following}</p>
                <p className="text-xs text-slate-500">Takip</p>
              </div>
            </div>

            {/* KYC Banner */}
            {!user?.isKYCVerified && (
              <Link href="/kyc">
                <div className="mt-4 p-4 bg-slate-100 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Kredin Tükendi!</p>
                      <p className="text-xs text-slate-600">Kredi al, üretime devam et.</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white rounded-lg text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors">
                    Satın Al
                  </button>
                </div>
              </Link>
            )}
          </div>

          {/* Menu Items */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <Link href="/posts">
              <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <IoImageOutline className="w-6 h-6 text-slate-700" />
                  <span className="text-sm font-medium text-slate-900">Fotoğraflarım</span>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link href="/wallet">
              <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-900">Abonelik & Kredi</span>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link href="/analytics">
              <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-900">İstatistikler</span>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link href="/settings">
              <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <IoSettingsOutline className="w-6 h-6 text-slate-700" />
                  <span className="text-sm font-medium text-slate-900">Ayarlar</span>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
