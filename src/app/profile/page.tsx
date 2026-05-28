'use client';

import { useState, useEffect } from 'react';
import { IoCreateOutline, IoGridOutline, IoHeartOutline, IoLocationOutline, IoBriefcaseOutline, IoLinkOutline, IoCalendarOutline } from 'react-icons/io5';
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

interface Post {
  id: string;
  images?: string[];
  videos?: string[];
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<UserStats>({ posts: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user?.avatar) setAvatarPreview(user.avatar);
  }, [user]);

  useEffect(() => {
    if (user?.id) loadProfileData();
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return setLoading(false);

    try {
      const token = localStorage.getItem('accessToken');
      
      const [postsRes, followRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${user.id}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        const postsList = Array.isArray(data.data) ? data.data : [];
        setPosts(postsList);
        setStats(prev => ({ ...prev, posts: postsList.length }));
      }

      if (followRes.ok) {
        const data = await followRes.json();
        setStats(prev => ({
          ...prev,
          followers: data.followers || data.data?.followers || 0,
          following: data.following || data.data?.following || 0
        }));
      }
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
    reader.onloadend = () => setAvatarPreview(reader.result as string);
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
        }
      } else {
        showToast('Failed to update profile picture', 'error');
        setAvatarPreview(user?.avatar || '');
      }
    } catch (error) {
      showToast('Failed to update profile picture', 'error');
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
      <div className="min-h-screen bg-slate-950 pb-20 lg:pb-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Profile Header - Compact */}
          <div className="px-3 pt-3 pb-2">
            {/* Avatar */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt={user?.username || 'User'} width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                </div>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer">
                  <IoCreateOutline className="w-3.5 h-3.5 text-white" />
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Username */}
            <div className="text-center mb-3">
              <h1 className="text-white text-sm font-medium">@{user?.username}</h1>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 mb-3">
              <div className="text-center">
                <p className="text-white text-base font-semibold">{stats.following}</p>
                <p className="text-slate-400 text-xs">Following</p>
              </div>
              <div className="text-center">
                <p className="text-white text-base font-semibold">{stats.followers}</p>
                <p className="text-slate-400 text-xs">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-white text-base font-semibold">{stats.posts}</p>
                <p className="text-slate-400 text-xs">Posts</p>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Link href="/settings">
              <button className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold rounded-lg transition-colors mb-3">
                Edit Profile
              </button>
            </Link>

            {/* User Info - Compact */}
            <div className="space-y-1 text-xs">
              {user?.city && (
                <div className="flex items-center gap-2 text-slate-300">
                  <IoLocationOutline className="w-3.5 h-3.5" />
                  <span>{user.city}, {user.state || user.country}</span>
                </div>
              )}
              {user?.bio && (
                <div className="flex items-center gap-2 text-slate-300">
                  <IoBriefcaseOutline className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{user.bio}</span>
                </div>
              )}
              {user?.createdAt && (
                <div className="flex items-center gap-2 text-slate-300">
                  <IoCalendarOutline className="w-3.5 h-3.5" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-slate-800">
            <button className="flex-1 py-3 flex items-center justify-center gap-2 border-b-2 border-white">
              <IoGridOutline className="w-5 h-5 text-white" />
            </button>
            <button className="flex-1 py-3 flex items-center justify-center gap-2 border-b-2 border-transparent">
              <IoHeartOutline className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-3 gap-0.5">
            {loading ? (
              <div className="col-span-3 py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="col-span-3 py-20 text-center">
                <IoGridOutline className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => {
                const media = post.images?.[0] || post.videos?.[0];
                return (
                  <Link key={post.id} href={`/post/${post.id}`}>
                    <div className="aspect-square bg-slate-900 relative overflow-hidden">
                      {media ? (
                        <Image src={media} alt="Post" fill className="object-cover hover:opacity-90 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <IoGridOutline className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

        </div>
      </div>
    </AppShell>
  );
}
