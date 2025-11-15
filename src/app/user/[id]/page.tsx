'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  IoArrowBack,
  IoPersonAddOutline,
  IoPersonRemoveOutline,
  IoChatbubbleOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoHeartOutline,
  IoHeart,
  IoChatbubbleEllipsesOutline,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  createdAt: string;
  isFollowing: boolean;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

interface Post {
  id: string;
  description: string;
  images?: string[];
  createdAt: string;
  _count: {
    likes: number;
    comments: number;
  };
  isLiked: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [params.id]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // First try the users endpoint
      let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // If that fails, try the user endpoint (singular)
      if (!response.ok) {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        const userData = data.user || data.data || data;
        
        // Fetch user posts to get count
        let postsCount = 0;
        try {
          const postsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${params.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            const posts = Array.isArray(postsData.data) ? postsData.data : Array.isArray(postsData.posts) ? postsData.posts : Array.isArray(postsData) ? postsData : [];
            postsCount = posts.length;
          }
        } catch (err) {
          console.error('Error fetching posts count:', err);
        }
        
        // Fetch user stats separately
        let followersCount = 0;
        let followingCount = 0;
        
        try {
          const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${params.id}/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            followersCount = statsData.followers || statsData.data?.followers || 0;
            followingCount = statsData.following || statsData.data?.following || 0;
          }
        } catch (err) {
          console.error('Error fetching follow stats:', err);
        }
        
        setProfile({
          id: userData.id,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.avatar,
          bio: userData.bio,
          city: userData.city,
          state: userData.state,
          country: userData.country,
          createdAt: userData.createdAt,
          isFollowing: userData.isFollowing || false,
          _count: {
            posts: postsCount,
            followers: followersCount,
            following: followingCount,
          },
        });
      } else {
        showToast('User not found', 'error');
        router.push('/feed');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      showToast('Failed to load profile', 'error');
      router.push('/feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle different response formats
        const postsData = data.posts || data.data || data;
        setPosts(Array.isArray(postsData) ? postsData : []);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setPosts([]);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = profile.isFollowing ? '/api/follow/unfollow' : '/api/follow';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (response.ok) {
        setProfile({
          ...profile,
          isFollowing: !profile.isFollowing,
          _count: {
            ...profile._count,
            followers: profile.isFollowing ? profile._count.followers - 1 : profile._count.followers + 1,
          },
        });
        showToast(profile.isFollowing ? 'Unfollowed' : 'Following', 'success');
      }
    } catch (error) {
      console.error('Error following user:', error);
      showToast('Failed to update follow status', 'error');
    }
  };

  const handleMessage = async () => {
    if (!profile) return;

    try {
      showToast('Opening chat...', 'info');
      const token = localStorage.getItem('accessToken');
      
      // Create or get existing chat
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'DIRECT',
          participants: [profile.id],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const chatId = data.data?.id || data.id;
        
        // Wait a moment for the chat to be created
        setTimeout(() => {
          router.push(`/chat?chatId=${chatId}`);
        }, 500);
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to open chat', 'error');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      showToast('Failed to open chat', 'error');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                _count: { 
                  ...post._count, 
                  likes: post.isLiked ? post._count.likes - 1 : post._count.likes + 1 
                }
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return null;
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-48 lg:pb-8">
        {/* Header - Compact for small screens */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-3 sm:py-6 mb-4">
          <div className="max-w-4xl mx-auto px-3 sm:px-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white mb-2 sm:mb-3 transition-colors text-sm"
            >
              <IoArrowBack className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-white">Profile</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          {/* Profile Card - Optimized for small screens */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-700 overflow-hidden shadow-xl mb-4">
            {/* Cover - Smaller on mobile */}
            <div className="h-20 sm:h-32 bg-gradient-to-r from-blue-500 to-purple-500"></div>

            {/* Profile Info */}
            <div className="px-3 sm:px-4 pb-4">
              {/* Avatar and Actions */}
              <div className="flex items-end justify-between -mt-10 sm:-mt-16 mb-3">
                <div className="relative">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={profile.username}
                      width={80}
                      height={80}
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-3 border-slate-900 object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-3 border-slate-900 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                      <span className="text-xl sm:text-3xl font-bold text-white">
                        {profile.firstName[0]}{profile.lastName[0]}
                      </span>
                    </div>
                  )}
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-1.5 sm:gap-2">
                    <button
                      onClick={handleMessage}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <IoChatbubbleOutline className="w-4 h-4" />
                      <span className="hidden xs:inline">Message</span>
                    </button>
                    <button
                      onClick={handleFollow}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 ${
                        profile.isFollowing
                          ? 'bg-slate-700 hover:bg-slate-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {profile.isFollowing ? (
                        <>
                          <IoPersonRemoveOutline className="w-4 h-4" />
                          <span className="hidden xs:inline">Unfollow</span>
                        </>
                      ) : (
                        <>
                          <IoPersonAddOutline className="w-4 h-4" />
                          <span className="hidden xs:inline">Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="mb-3">
                <h1 className="text-base sm:text-xl font-bold text-white mb-0.5">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-gray-400 text-sm mb-2">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-gray-300 text-sm mb-2">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
                  {profile.city && (
                    <div className="flex items-center gap-1">
                      <IoLocationOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="truncate max-w-[150px]">{profile.city}, {profile.state || profile.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <IoCalendarOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}</span>
                  </div>
                </div>
              </div>

              {/* Stats - Compact */}
              <div className="flex gap-3 sm:gap-4 pt-3 border-t border-slate-700">
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">{profile._count.posts}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">Posts</p>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">{profile._count.followers}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">Followers</p>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">{profile._count.following}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">Following</p>
                </div>
              </div>
            </div>
          </div>

          {/* Posts - Compact */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white px-1">Posts</h2>
            {posts.length === 0 ? (
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 p-8 text-center">
                <p className="text-gray-400 text-sm">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
                  <div className="p-3">
                    <p className="text-gray-300 text-sm whitespace-pre-wrap mb-2 line-clamp-3">{post.description}</p>
                    {post.images && post.images.length > 0 && (
                      <div className={`grid gap-1.5 mb-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {post.images.map((image, index) => (
                          <div key={index} className="relative rounded-md overflow-hidden bg-slate-700 aspect-square">
                            <Image src={image} alt="Post image" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-gray-400 text-xs">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
                      >
                        {post.isLiked ? (
                          <IoHeart className="w-4 h-4 text-red-500" />
                        ) : (
                          <IoHeartOutline className="w-4 h-4" />
                        )}
                        <span>{post._count.likes}</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <IoChatbubbleEllipsesOutline className="w-4 h-4" />
                        <span>{post._count.comments}</span>
                      </div>
                      <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
