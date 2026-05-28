'use client';

import { useState, useEffect } from 'react';
import {
  IoPersonOutline,
  IoMailOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoCreateOutline,
  IoHeartOutline,
  IoEyeOutline,
  IoChatbubbleOutline,
  IoSettingsOutline,
  IoImageOutline,
  IoCloseOutline,
  IoPeopleOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

interface UserStats {
  posts: number;
  followers: number;
  following: number;
  likes: number;
  views: number;
}

interface Post {
  id: string;
  title?: string;
  description: string;
  images?: string[];
  type?: string;
  createdAt: string;
  _count: {
    likes: number;
    comments: number;
  };
}

interface FollowUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isKYCVerified?: boolean;
  bio?: string;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<UserStats>({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
    views: 0,
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

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
      
      let posts: Post[] = [];
      try {
        const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          posts = Array.isArray(postsData.data) ? postsData.data : [];
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
      
      setRecentPosts(posts);
      const totalLikes = posts.reduce((sum: number, post: Post) => sum + (post._count?.likes || 0), 0);
      
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
        posts: posts.length,
        followers: followersCount,
        following: followingCount,
        likes: totalLikes,
        views: 0,
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

  const loadFollowers = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingFollowers(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${user.id}/followers`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const result = await response.json();
        setFollowers(result.data || result.followers || []);
      }
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const loadFollowing = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingFollowing(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${user.id}/following`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const result = await response.json();
        setFollowing(result.data || result.following || []);
      }
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleShowFollowers = () => {
    setShowFollowersModal(true);
    loadFollowers();
  };

  const handleShowFollowing = () => {
    setShowFollowingModal(true);
    loadFollowing();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return (user?.username?.[0] || 'U').toUpperCase();
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto px-4 pt-6">
          
          {/* Profile Header Card - Glassmorphism */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden shadow-2xl mb-6">
            {/* Cover with gradient */}
            <div className="h-32 lg:h-48 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
            </div>

            <div className="px-6 pb-6">
              {/* Avatar and Edit Button */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between -mt-16 lg:-mt-20 mb-6">
                <div className="relative group mb-4 lg:mb-0">
                  <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-slate-900 shadow-2xl">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt={user?.username || 'User'}
                        width={144}
                        height={144}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-2xl flex items-center justify-center cursor-pointer shadow-lg transition-all hover:scale-110 backdrop-blur-sm"
                  >
                    <IoCreateOutline className="w-5 h-5 text-white" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl backdrop-blur-sm">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                <Link href="/settings">
                  <button className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700/70 backdrop-blur-sm text-white rounded-2xl font-semibold transition-all flex items-center gap-2 border border-slate-600/50">
                    <IoSettingsOutline className="w-5 h-5" />
                    Edit Profile
                  </button>
                </Link>
              </div>

              {/* User Info */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  {user?.isKYCVerified && (
                    <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center gap-1.5">
                      <IoShieldCheckmarkOutline className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold text-blue-400">Verified</span>
                    </div>
                  )}
                </div>
                <p className="text-slate-400 mb-4">@{user?.username}</p>
                
                {user?.bio && (
                  <p className="text-slate-300 leading-relaxed mb-4">{user.bio}</p>
                )}

                {/* User Details */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  {user?.email && (
                    <div className="flex items-center gap-2">
                      <IoMailOutline className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user?.city && (
                    <div className="flex items-center gap-2">
                      <IoLocationOutline className="w-4 h-4" />
                      <span>{user.city}, {user.state || user.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <IoCalendarOutline className="w-4 h-4" />
                    <span>Joined {formatDate(user?.createdAt || new Date().toISOString())}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all">
                  <p className="text-2xl font-bold text-white mb-1">{stats.posts}</p>
                  <p className="text-xs text-slate-400">Posts</p>
                </div>
                <button 
                  onClick={handleShowFollowers}
                  className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all text-left"
                >
                  <p className="text-2xl font-bold text-white mb-1">{stats.followers}</p>
                  <p className="text-xs text-slate-400">Followers</p>
                </button>
                <button 
                  onClick={handleShowFollowing}
                  className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all text-left"
                >
                  <p className="text-2xl font-bold text-white mb-1">{stats.following}</p>
                  <p className="text-xs text-slate-400">Following</p>
                </button>
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all">
                  <p className="text-2xl font-bold text-white mb-1">{stats.likes}</p>
                  <p className="text-xs text-slate-400">Likes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Posts */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4">Your Posts</h2>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : recentPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                      <IoImageOutline className="w-10 h-10 text-slate-500" />
                    </div>
                    <p className="text-slate-400 mb-6">No posts yet</p>
                    <Link
                      href="/feed"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all"
                    >
                      <IoCreateOutline className="w-5 h-5" />
                      Create Your First Post
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPosts.map((post) => (
                      <div 
                        key={post.id} 
                        className="p-4 bg-slate-700/30 backdrop-blur-sm rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all group"
                      >
                        <p className="text-slate-300 text-sm line-clamp-2 mb-3">{post.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <IoHeartOutline className="w-4 h-4" />
                              {post._count.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <IoChatbubbleOutline className="w-4 h-4" />
                              {post._count.comments}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* KYC Status */}
              {!user?.isKYCVerified && (
                <Link href="/kyc">
                  <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                        <IoShieldCheckmarkOutline className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Get Verified</h3>
                        <p className="text-xs text-slate-400">Unlock premium features</p>
                      </div>
                    </div>
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all">
                      Start Verification
                    </button>
                  </div>
                </Link>
              )}

              {/* Quick Links */}
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/posts" className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all group">
                    <div className="flex items-center gap-3">
                      <IoImageOutline className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">My Posts</span>
                    </div>
                    <span className="text-slate-500 group-hover:text-slate-400">→</span>
                  </Link>
                  <Link href="/analytics" className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-xl transition-all group">
                    <div className="flex items-center gap-3">
                      <IoEyeOutline className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Analytics</span>
                    </div>
                    <span className="text-slate-500 group-hover:text-slate-400">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowFollowersModal(false)}>
          <div className="bg-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Followers</h3>
              <button onClick={() => setShowFollowersModal(false)} className="p-2 hover:bg-slate-700 rounded-xl transition-colors">
                <IoCloseOutline className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            {loadingFollowers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : followers.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No followers yet</p>
            ) : (
              <div className="space-y-2">
                {followers.map((follower) => (
                  <div key={follower.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {follower.firstName?.[0]}{follower.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{follower.firstName} {follower.lastName}</p>
                      <p className="text-slate-400 text-xs">@{follower.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowFollowingModal(false)}>
          <div className="bg-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Following</h3>
              <button onClick={() => setShowFollowingModal(false)} className="p-2 hover:bg-slate-700 rounded-xl transition-colors">
                <IoCloseOutline className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            {loadingFollowing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : following.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Not following anyone yet</p>
            ) : (
              <div className="space-y-2">
                {following.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-slate-400 text-xs">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
