'use client';

import { useState, useEffect } from 'react';
import {
  IoPersonOutline,
  IoMailOutline,
  IoLocationOutline,
  IoLinkOutline,
  IoCalendarOutline,
  IoCreateOutline,
  IoStatsChartOutline,
  IoHeartOutline,
  IoEyeOutline,
  IoChatbubbleOutline,
  IoShareSocialOutline,
  IoSettingsOutline,
  IoImageOutline,
  IoCloseOutline,
  IoPeopleOutline,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';
import DashboardOverview from '@/components/dashboard/DashboardOverview';

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
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // Update avatar preview when user data is available
  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
    }
  }, [user?.avatar]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'error');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        // Get the actual avatar URL from the response
        const newAvatarUrl = data.user?.avatar || data.avatar;
        
        if (newAvatarUrl) {
          // Add timestamp to force cache refresh across all devices
          const timestampedUrl = `${newAvatarUrl}?t=${Date.now()}`;
          
          // Update user in AuthContext with the actual URL from backend
          updateUser({
            avatar: timestampedUrl,
          });
          
          // Update preview to show the actual uploaded image
          setAvatarPreview(timestampedUrl);
          
          // Force reload user data from backend to sync across devices
          setTimeout(() => {
            window.location.reload();
          }, 500);
          
          showToast('Profile picture updated successfully!', 'success');
        } else {
          showToast('Profile picture uploaded but URL not received', 'error');
        }
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to update profile picture', 'error');
        // Revert preview on error
        setAvatarPreview(user?.avatar || '');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile picture', 'error');
      // Revert preview on error
      setAvatarPreview(user?.avatar || '');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]); // Run when user ID is available

  // Auto-refresh stats every 10 seconds for real-time updates
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      loadProfileData();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      // Load user posts
      const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        const posts = Array.isArray(postsData.posts) ? postsData.posts : Array.isArray(postsData) ? postsData : [];
        setRecentPosts(posts);
        
        // Calculate total likes from posts
        const totalLikes = posts.reduce((sum: number, post: Post) => sum + post._count.likes, 0);
        
        setStats(prev => ({ 
          ...prev, 
          posts: posts.length,
          likes: totalLikes,
        }));
      }

      // Load follow stats
      const followResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (followResponse.ok) {
        const followData = await followResponse.json();
        setStats(prev => ({
          ...prev,
          followers: followData.followers || 0,
          following: followData.following || 0,
        }));
      }
      
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowers = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingFollowers(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${user.id}/followers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers || []);
      }
    } catch (error) {
      console.error('Error loading followers:', error);
      showToast('Failed to load followers', 'error');
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following || []);
      }
    } catch (error) {
      console.error('Error loading following:', error);
      showToast('Failed to load following', 'error');
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



  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-32 lg:pb-8">
        {/* Hero Header - Compact */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-3 sm:py-6 mb-4">
          <div className="max-w-4xl mx-auto px-3 sm:px-4">
            <Link href="/feed" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white mb-2 sm:mb-3 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs sm:text-sm">Back to Feed</span>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold text-white">My Profile</h1>
            <p className="text-xs sm:text-sm text-white/80 mt-0.5">Manage your account and view your activity</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-4">

          {/* Profile Card - Clean & Simple */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-700 overflow-hidden shadow-xl">
            {/* Simple gradient header */}
            <div className="h-16 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-500"></div>

            {/* Profile Content */}
            <div className="px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6">
              {/* Avatar and Change Picture Button */}
              <div className="flex items-end justify-between -mt-8 sm:-mt-10 mb-3 sm:mb-4">
                <div className="relative group">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={user?.username || 'User'}
                      width={64}
                      height={64}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-slate-900 object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-slate-900 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                <label className="px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg font-medium transition-colors cursor-pointer">
                  {isUploading ? 'Uploading...' : 'Change Picture'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* User Info */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h1 className="text-base sm:text-xl font-bold text-white">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  {user?.isKYCVerified && (
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">@{user?.username}</p>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {user?.bio || 'No bio yet'}
                </p>
              </div>

              {/* User Details */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 text-xs sm:text-sm text-gray-400">
                {user?.email && (
                  <div className="flex items-center gap-1">
                    <IoMailOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[200px]">{user.email}</span>
                  </div>
                )}
                {user?.city && (
                  <div className="flex items-center gap-1">
                    <IoLocationOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{user.city}, {user.state || user.country}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <IoCalendarOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Joined {formatDate(user?.createdAt || new Date().toISOString())}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-700">
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">{stats.posts}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">Posts</p>
                </div>
                <button 
                  onClick={handleShowFollowers}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <p className="text-base sm:text-lg font-bold text-white">{stats.followers}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">Followers</p>
                </button>
                <button 
                  onClick={handleShowFollowing}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <p className="text-base sm:text-lg font-bold text-white">{stats.following}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">Following</p>
                </button>
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">{stats.likes}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">Likes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
            {/* Recent Posts */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Your Posts</h2>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : recentPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
                      <IoImageOutline className="w-10 h-10 text-gray-500" />
                    </div>
                    <p className="text-gray-400 mb-6">No posts yet</p>
                    <Link
                      href="/feed"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:scale-105"
                    >
                      <IoCreateOutline className="w-5 h-5" />
                      Create Your First Post
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-all group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {post.title && <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400 transition-colors">{post.title}</h3>}
                            <p className="text-gray-300 text-sm line-clamp-2 mb-3">{post.description}</p>
                            <div className="flex items-center gap-6 text-sm text-gray-400">
                              <span className="flex items-center gap-1.5">
                                <IoHeartOutline className="w-4 h-4" />
                                {post._count.likes}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <IoChatbubbleOutline className="w-4 h-4" />
                                {post._count.comments}
                              </span>
                              <span className="ml-auto text-xs">{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this post?')) {
                                try {
                                  const token = localStorage.getItem('accessToken');
                                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                    },
                                  });
                                  
                                  if (response.ok) {
                                    setRecentPosts(recentPosts.filter(p => p.id !== post.id));
                                    setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
                                    showToast('Post deleted successfully', 'success');
                                  } else {
                                    showToast('Failed to delete post', 'error');
                                  }
                                } catch (error: any) {
                                  showToast(error.message || 'Failed to delete post', 'error');
                                }
                              }
                            }}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Activity Stats */}
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-xl">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Activity</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-gray-400 text-xs sm:text-sm">This Week</span>
                    <span className="text-white text-sm sm:text-base font-bold">{Math.min(stats.posts, 12)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-gray-400 text-xs sm:text-sm">This Month</span>
                    <span className="text-white text-sm sm:text-base font-bold">{Math.min(stats.posts, 45)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-gray-400 text-xs sm:text-sm">Total Views</span>
                    <span className="text-white text-sm sm:text-base font-bold">{stats.views > 1000 ? `${(stats.views / 1000).toFixed(1)}K` : stats.views}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700 shadow-xl">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/feed"
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg sm:rounded-xl transition-all text-blue-400 hover:text-blue-300 group"
                  >
                    <IoCreateOutline className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="text-sm sm:text-base font-medium">Create Post</span>
                  </Link>
                  <button className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg sm:rounded-xl transition-all text-gray-300 hover:text-white group">
                    <IoStatsChartOutline className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="text-sm sm:text-base font-medium">View Analytics</span>
                  </button>
                  <label className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg sm:rounded-xl transition-all text-gray-300 hover:text-white group cursor-pointer">
                    <IoImageOutline className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="text-sm sm:text-base font-medium">Change Picture</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Followers Modal */}
        {showFollowersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Followers</h2>
                <button
                  onClick={() => setShowFollowersModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <IoCloseOutline className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                {loadingFollowers ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : followers.length === 0 ? (
                  <div className="text-center py-12">
                    <IoPeopleOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No followers yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {followers.map((follower) => (
                      <Link
                        key={follower.id}
                        href={`/user/${follower.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-slate-700/50 transition-colors"
                        onClick={() => setShowFollowersModal(false)}
                      >
                        {follower.avatar ? (
                          <Image
                            src={follower.avatar}
                            alt={follower.username}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {follower.firstName[0]}{follower.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-white font-medium truncate">
                              {follower.firstName} {follower.lastName}
                            </p>
                            {follower.isKYCVerified && (
                              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">@{follower.username}</p>
                          {follower.bio && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{follower.bio}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Following Modal */}
        {showFollowingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Following</h2>
                <button
                  onClick={() => setShowFollowingModal(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <IoCloseOutline className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                {loadingFollowing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : following.length === 0 ? (
                  <div className="text-center py-12">
                    <IoPeopleOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Not following anyone yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {following.map((followedUser) => (
                      <Link
                        key={followedUser.id}
                        href={`/user/${followedUser.id}`}
                        className="flex items-center gap-3 p-4 hover:bg-slate-700/50 transition-colors"
                        onClick={() => setShowFollowingModal(false)}
                      >
                        {followedUser.avatar ? (
                          <Image
                            src={followedUser.avatar}
                            alt={followedUser.username}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {followedUser.firstName[0]}{followedUser.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-white font-medium truncate">
                              {followedUser.firstName} {followedUser.lastName}
                            </p>
                            {followedUser.isKYCVerified && (
                              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">@{followedUser.username}</p>
                          {followedUser.bio && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{followedUser.bio}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


    </AppShell>
  );
}
