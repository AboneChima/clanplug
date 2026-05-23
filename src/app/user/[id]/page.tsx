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
  IoShieldCheckmarkOutline,
  IoCloseCircleOutline,
  IoEyeOutline,
  IoCloseOutline,
  IoPeopleOutline,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import PostModal from '@/components/PostModal';
import Image from 'next/image';
import Link from 'next/link';
import VerifiedProfileHeader from '@/components/VerifiedProfileHeader';
import VerifiedAvatar from '@/components/VerifiedAvatar';
import { formatCount } from '@/lib/formatNumber';

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
  isFollowingBack: boolean;
  isMutual: boolean;
  isKYCVerified?: boolean;
  isVerified?: boolean;
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
  const [marketplacePosts, setMarketplacePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPosts, setShowPosts] = useState(false); // Start with both hidden
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [showAvatarOverlay, setShowAvatarOverlay] = useState(false);

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
        console.log('User profile data:', userData);
        
        // Check if user is banned or suspended
        if (userData.status === 'BANNED' || userData.status === 'banned') {
          showToast('This user account has been suspended', 'error');
          router.push('/feed');
          return;
        }
        
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
        
        // Properly extract KYC status
        const isKYCVerified = userData.isKYCVerified === true || userData.isKYCVerified === 'true';
        
        console.log('KYC Status:', {
          raw: userData.isKYCVerified,
          processed: isKYCVerified
        });
        
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
          isFollowingBack: userData.isFollowingBack || false,
          isMutual: (userData.isFollowing && userData.isFollowingBack) || false,
          isKYCVerified: isKYCVerified,
          verificationBadge: userData.verificationBadge, // Include verification badge
          _count: {
            posts: postsCount,
            followers: followersCount,
            following: followingCount,
          },
        } as any);
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
      
      // Fetch all posts for this user
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User posts response:', data);
        const allPosts = data.posts || data.data || data;
        
        if (Array.isArray(allPosts)) {
          // Separate social posts and marketplace listings
          const socialPosts = allPosts.filter((p: any) => p.type === 'SOCIAL_POST');
          const marketPosts = allPosts.filter((p: any) => 
            p.type === 'MARKETPLACE_LISTING' || 
            p.type === 'GAME_ACCOUNT'
          );
          
          console.log('Social posts:', socialPosts.length);
          console.log('Marketplace posts:', marketPosts.length);
          
          setPosts(socialPosts);
          setMarketplacePosts(marketPosts);
        } else {
          setPosts([]);
          setMarketplacePosts([]);
        }
      } else {
        console.error('Failed to fetch posts:', response.status);
        setPosts([]);
        setMarketplacePosts([]);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setPosts([]);
      setMarketplacePosts([]);
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
        const newIsFollowing = !profile.isFollowing;
        const newIsMutual = newIsFollowing && profile.isFollowingBack;
        
        setProfile({
          ...profile,
          isFollowing: newIsFollowing,
          isMutual: newIsMutual,
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
  // Check multiple possible verification statuses
  const verificationBadge = (profile as any)?.verificationBadge;
  const isVerified = verificationBadge?.status === 'active' || 
                     verificationBadge?.status === 'verified' || 
                     verificationBadge?.status === 'ACTIVE' ||
                     (profile as any)?.isVerified === true;

  // Debug logging
  console.log('🎄 Profile verification check:', {
    userId: profile.id,
    username: profile.username,
    verificationBadge: verificationBadge,
    isVerified: isVerified,
    rawProfile: profile
  });

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
          {/* Profile Card - Modern Clean Design with Verified Enhancement */}
          <VerifiedProfileHeader isVerified={isVerified}>
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
                  <button 
                    onClick={() => setShowAvatarOverlay(true)}
                    className="relative cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <VerifiedAvatar
                      src={profile.avatar}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      isVerified={isVerified}
                      size="lg"
                    />
                  </button>

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
                        profile.isMutual
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : profile.isFollowing
                          ? 'bg-slate-700 hover:bg-slate-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {profile.isMutual ? (
                        <>
                          <IoPeopleOutline className="w-4 h-4" />
                          <span className="hidden xs:inline">Friends</span>
                        </>
                      ) : profile.isFollowing ? (
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
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h1 className="text-base sm:text-xl font-bold text-white">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {(profile as any)?.verificationBadge?.status === 'active' || (profile as any)?.verificationBadge?.status === 'verified' ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : null}
                </div>
                <p className="text-gray-400 text-sm mb-2">@{profile.username}</p>
                
                {/* KYC Status Badge - Compact */}
                <div className="mb-2">
                  {profile.isKYCVerified ? (
                    <div className="inline-flex items-center gap-1 bg-green-500/20 border border-green-500/40 rounded-md px-2 py-1">
                      <IoShieldCheckmarkOutline className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-[11px] font-medium text-green-400">KYC Verified</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 bg-gray-500/10 border border-gray-500/30 rounded-md px-2 py-1">
                      <IoCloseCircleOutline className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] font-medium text-gray-400">KYC Unverified</span>
                    </div>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="text-gray-300 text-sm mb-2 whitespace-pre-wrap">{profile.bio}</p>
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

              {/* Stats - Modern Grid Layout - Clickable */}
              <div className="grid grid-cols-3 gap-1 xs:gap-1.5 sm:gap-4 pt-2 xs:pt-3 sm:pt-4 border-t border-slate-700 mb-3">
                <div className="text-center p-1.5 xs:p-2 sm:p-3 rounded-md xs:rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <p className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white">{formatCount(profile._count.posts)}</p>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 mt-0.5">Posts</p>
                </div>
                <button 
                  onClick={async () => {
                    setShowFollowersModal(true);
                    setLoadingFollowers(true);
                    try {
                      const token = localStorage.getItem('accessToken');
                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${profile.id}/followers`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (response.ok) {
                        const data = await response.json();
                        setFollowers(data.data || []);
                      }
                    } catch (error) {
                      console.error('Error fetching followers:', error);
                    } finally {
                      setLoadingFollowers(false);
                    }
                  }}
                  className="text-center p-1.5 xs:p-2 sm:p-3 rounded-md xs:rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <p className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white">{formatCount(profile._count.followers)}</p>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 mt-0.5">Followers</p>
                </button>
                <button 
                  onClick={async () => {
                    setShowFollowingModal(true);
                    setLoadingFollowers(true);
                    try {
                      const token = localStorage.getItem('accessToken');
                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${profile.id}/following`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (response.ok) {
                        const data = await response.json();
                        setFollowing(data.data || []);
                      }
                    } catch (error) {
                      console.error('Error fetching following:', error);
                    } finally {
                      setLoadingFollowers(false);
                    }
                  }}
                  className="text-center p-1.5 xs:p-2 sm:p-3 rounded-md xs:rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <p className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white">{formatCount(profile._count.following)}</p>
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 mt-0.5">Following</p>
                </button>
              </div>
              </div>

              {/* View Posts Buttons - Toggle Social and Marketplace */}
              <div className="flex gap-1 xs:gap-1.5 sm:gap-2 pb-2 xs:pb-2.5 sm:pb-3 border-b border-slate-700">
                <button
                  onClick={() => {
                    setShowPosts(!showPosts);
                    setShowMarketplace(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-md xs:rounded-lg transition-colors text-[9px] xs:text-[11px] sm:text-sm md:text-base font-medium ${
                    showPosts 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                  }`}
                >
                  <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Social</span>
                </button>
                <button
                  onClick={() => {
                    setShowMarketplace(!showMarketplace);
                    setShowPosts(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-md xs:rounded-lg transition-colors text-[9px] xs:text-[11px] sm:text-sm md:text-base font-medium ${
                    showMarketplace 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                  }`}
                >
                  <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Shop</span>
                </button>
              </div>
            </div>
          </VerifiedProfileHeader>

          {/* Social Posts - Compact - Toggle visibility */}
          {showPosts && (
            <div id="user-posts" className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-white px-1">Social Posts</h2>
            {posts.length === 0 ? (
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 p-8 text-center">
                <p className="text-gray-400 text-sm">No social posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors cursor-pointer" onClick={() => setSelectedPostId(post.id)}>
                  <div className="p-2">
                    <p className="text-gray-300 text-xs whitespace-pre-wrap mb-1.5 line-clamp-2">{post.description}</p>
                    {post.images && post.images.length > 0 && (
                      <div className={`grid gap-1 mb-1.5 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {post.images.slice(0, 2).map((image, index) => (
                          <div key={index} className="relative rounded-md overflow-hidden bg-slate-700 aspect-square max-h-32">
                            <Image src={image} alt="Post image" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-400 text-[10px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post.id);
                          }}
                          className="flex items-center gap-1 hover:text-red-500 transition-colors"
                        >
                          {post.isLiked ? (
                            <IoHeart className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <IoHeartOutline className="w-3.5 h-3.5" />
                          )}
                          <span>{post._count.likes}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <IoChatbubbleEllipsesOutline className="w-3.5 h-3.5" />
                          <span>{post._count.comments}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPostId(post.id);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-[10px] font-medium flex items-center gap-0.5"
                      >
                        View Post
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          )}

          {/* Marketplace Listings - Toggle visibility */}
          {showMarketplace && (
            <div id="user-marketplace" className="space-y-2 sm:space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-white px-1">Marketplace Listings</h2>
            {marketplacePosts.length === 0 ? (
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 p-8 text-center">
                <p className="text-gray-400 text-sm">No marketplace listings yet</p>
              </div>
            ) : (
              marketplacePosts.map((post) => (
                <div 
                  key={post.id} 
                  className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden hover:border-blue-500 transition-all"
                >
                  {/* Mobile: Compact horizontal layout */}
                  <div className="md:hidden">
                    <div className="flex gap-2 p-2">
                      {/* Image - Smaller on mobile */}
                      {post.images && post.images.length > 0 && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (post.images && post.images[0]) {
                              setSelectedImage(post.images[0]);
                            }
                          }}
                          className="relative w-20 h-20 rounded-md overflow-hidden bg-slate-700 flex-shrink-0 cursor-pointer"
                        >
                          <Image src={post.images[0]} alt="Listing" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                            <IoEyeOutline className="w-5 h-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )}
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-xs line-clamp-2 mb-1">{post.description}</p>
                        <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                          <div className="flex items-center gap-1">
                            <IoHeart className={post.isLiked ? "w-3 h-3 text-red-500" : "w-3 h-3"} />
                            <span>{post._count.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IoChatbubbleEllipsesOutline className="w-3 h-3" />
                            <span>{post._count.comments}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/marketplace/${post.id}`)}
                          className="mt-1 text-blue-400 hover:text-blue-300 text-[10px] font-medium"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Full layout */}
                  <div 
                    onClick={() => router.push(`/marketplace/${post.id}`)}
                    className="hidden md:block cursor-pointer"
                  >
                    <div className="p-3">
                      <p className="text-gray-300 text-sm whitespace-pre-wrap mb-2 line-clamp-3">{post.description}</p>
                      {post.images && post.images.length > 0 && (
                        <div className={`grid gap-1.5 mb-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {post.images.map((image, index) => (
                            <div 
                              key={index} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(image);
                              }}
                              className="relative rounded-md overflow-hidden bg-slate-700 aspect-square cursor-pointer group"
                            >
                              <Image src={image} alt="Post image" fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <IoEyeOutline className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-gray-400 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(post.id);
                          }}
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
                </div>
              ))
            )}
            </div>
          )}
        </div>
      </div>

      {/* Post Modal */}
      {selectedPostId && (
        <PostModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-white transition-colors"
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={selectedImage}
              alt="Full size"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowFollowersModal(false)}>
          <div className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Followers</h3>
              <button onClick={() => setShowFollowersModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                <IoCloseOutline className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {loadingFollowers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : followers.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No followers yet</p>
              ) : (
                <div className="space-y-2">
                  {followers.map((follower: any) => (
                    <Link
                      key={follower.id}
                      href={`/user/${follower.id}`}
                      className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      {follower.avatar ? (
                        <img src={follower.avatar} alt={follower.username} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{follower.firstName?.[0]}{follower.lastName?.[0]}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{follower.firstName} {follower.lastName}</p>
                        <p className="text-gray-400 text-xs truncate">@{follower.username}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowFollowingModal(false)}>
          <div className="bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Following</h3>
              <button onClick={() => setShowFollowingModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                <IoCloseOutline className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {loadingFollowers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : following.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Not following anyone yet</p>
              ) : (
                <div className="space-y-2">
                  {following.map((user: any) => (
                    <Link
                      key={user.id}
                      href={`/user/${user.id}`}
                      className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-gray-400 text-xs truncate">@{user.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avatar Overlay Modal */}
      {showAvatarOverlay && profile.avatar && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowAvatarOverlay(false)}
        >
          <button
            onClick={() => setShowAvatarOverlay(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <IoCloseOutline className="w-6 h-6 text-white" />
          </button>
          
          <div className="relative max-w-2xl w-full">
            <img
              src={profile.avatar}
              alt={`${profile.firstName} ${profile.lastName}`}
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            {isVerified && (
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-white text-sm font-medium">Verified User</span>
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm px-4 py-3 rounded-lg">
              <h3 className="text-white font-bold text-lg">{profile.firstName} {profile.lastName}</h3>
              <p className="text-gray-300 text-sm">@{profile.username}</p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
