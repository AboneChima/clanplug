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
      // Fetch both social posts and marketplace listings
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User posts response:', data);
        // Handle different response formats
        const postsData = data.posts || data.data || data;
        setPosts(Array.isArray(postsData) ? postsData : []);
      } else {
        console.error('Failed to fetch posts:', response.status);
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
      const method = profile.isFollowing ? 'DELETE' : 'POST';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${profile.id}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
        showToast(profile.isFollowing ? 'Unfollowed' : 'Now following!', 'success');
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to update follow status', 'error');
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
        const chatData = data.data || data;
        const chatId = chatData?.id;
        
        if (chatId) {
          // Store chat info in localStorage for immediate access
          localStorage.setItem('pendingChatId', chatId);
          localStorage.setItem('pendingChatUser', JSON.stringify({
            id: profile.id,
            username: profile.username,
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatar: profile.avatar
          }));
          
          // Navigate to chat
          router.push(`/chat?id=${chatId}`);
        } else {
          showToast('Failed to create chat', 'error');
        }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8">
        {/* Header - Clean Modern Design */}
        <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm py-4 sm:py-5 mb-4">
          <div className="max-w-4xl mx-auto px-3 sm:px-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white mb-3 transition-colors text-sm"
            >
              <IoArrowBack className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Profile</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          {/* Profile Card - Modern Clean Design */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-700 overflow-hidden shadow-xl mb-4">
            {/* Modern pattern cover */}
            <div className="h-24 sm:h-32 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="px-4 sm:px-6 pb-6">
              {/* Avatar and Actions */}
              <div className="flex items-end justify-between -mt-12 sm:-mt-16 mb-4">
                <div className="relative">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={profile.username}
                      width={96}
                      height={96}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-800 object-cover shadow-xl ring-2 ring-slate-700"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-800 bg-slate-700 flex items-center justify-center shadow-xl ring-2 ring-slate-700">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-400">
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

              {/* Stats - Modern Grid Layout */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-slate-700">
                <div className="text-center p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <p className="text-lg sm:text-xl font-bold text-white">{profile._count.posts}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Posts</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <p className="text-lg sm:text-xl font-bold text-white">{profile._count.followers}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Followers</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <p className="text-lg sm:text-xl font-bold text-white">{profile._count.following}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Following</p>
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
