'use client';

import { useState, useEffect } from 'react';
import { IoArrowBack, IoStorefrontOutline, IoNewspaperOutline, IoLocationOutline, IoBriefcaseOutline, IoCalendarOutline, IoEllipsisHorizontal, IoEyeOutline, IoHeartOutline, IoTimeOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';
import VideoThumbnail from '@/components/VideoThumbnail';

interface UserProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  createdAt: string;
  isKYCVerified?: boolean;
}

interface UserStats {
  posts: number;
  followers: number;
  following: number;
}

interface Post {
  id: string;
  title: string;
  description?: string;
  type?: string;
  price?: number;
  currency?: string;
  gameTitle?: string;
  images?: string[];
  videos?: string[];
  videoThumbnails?: string[];
  createdAt: string;
  views?: number;
  likes?: number;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ posts: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [marketListings, setMarketListings] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingMe, setIsFollowingMe] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'social'>('market');

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 State Update - isFollowing:', isFollowing, '| isFollowingMe:', isFollowingMe);
    console.log('   🎯 Button should display:', 
      isFollowing ? 'UNFOLLOW' : (isFollowingMe ? 'FOLLOW BACK' : 'FOLLOW')
    );
  }, [isFollowing, isFollowingMe]);

  useEffect(() => {
    if (params.id) {
      // Reset states when user changes
      setIsFollowing(false);
      setIsFollowingMe(false);
      loadUserProfile();
    }
  }, [params.id]);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const [userRes, postsRes, followRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${params.id}&limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${params.id}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (userRes.ok) {
        const data = await userRes.json();
        console.log('👤 User profile API response:', data);
        const userData = data.data || data.user;
        console.log('👤 Extracted user data:', userData);
        console.log('📍 User city field:', userData?.city);
        setUser(userData);
      }

      if (postsRes.ok) {
        const data = await postsRes.json();
        const postsList = Array.isArray(data.data) ? data.data : [];
        
        console.log('📹 Posts received:', postsList.length);
        postsList.forEach((p: Post, idx: number) => {
          if (p.videos && p.videos.length > 0) {
            console.log(`  Post ${idx + 1}:`, {
              id: p.id,
              title: p.title,
              hasVideo: true,
              videoUrl: p.videos[0],
              hasThumbnail: !!p.videoThumbnails?.[0],
              thumbnailUrl: p.videoThumbnails?.[0] || 'NONE'
            });
          }
        });
        
        // Separate market listings and social posts
        const market = postsList.filter((p: Post) => p.type !== 'SOCIAL_POST');
        const social = postsList.filter((p: Post) => p.type === 'SOCIAL_POST');
        
        setMarketListings(market);
        setPosts(social);
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

      // Check follow statuses
      if (currentUser?.id && params.id !== currentUser.id) {
        console.log('🔍 Checking follow relationships');
        console.log('   Current user:', currentUser.id);
        console.log('   Profile user:', params.id);
        
        // Check if I'm following them: GET /api/follow/{theirId}/check
        // This checks if logged-in user (me) is following params.id (them)
        const iFollowThemRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${params.id}/check`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('   📡 Check response status:', iFollowThemRes.status);
        
        if (iFollowThemRes.ok) {
          const data = await iFollowThemRes.json();
          console.log('   📊 Full API response:', JSON.stringify(data, null, 2));
          console.log('   📊 data.success:', data.success);
          console.log('   📊 data.isFollowing:', data.isFollowing);
          console.log('   📊 typeof data.isFollowing:', typeof data.isFollowing);
          
          const following = data.isFollowing === true;
          console.log('   ✅ Computed following value:', following);
          setIsFollowing(following);
          console.log('   ✅ Set isFollowing state to:', following);
          console.log('   🎯 Button should show:', following ? 'UNFOLLOW' : 'FOLLOW');
        } else {
          console.error('   ❌ Follow check failed:', iFollowThemRes.status);
          const errorData = await iFollowThemRes.json().catch(() => ({}));
          console.error('   ❌ Error data:', errorData);
        }
        
        // Check if they follow me: fetch my followers and see if their ID is there
        const theyFollowMeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${currentUser.id}/followers?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (theyFollowMeRes.ok) {
          const data = await theyFollowMeRes.json();
          const followers = data.data || [];
          const theyFollowMe = followers.some((f: any) => f.id === params.id);
          setIsFollowingMe(theyFollowMe);
          console.log('   ✅ They follow me:', theyFollowMe);
        }
        
        // Log final state after a brief delay to ensure state updates have processed
        setTimeout(() => {
          console.log('🏁 Final states after update:');
          console.log('   isFollowing:', isFollowing);
          console.log('   isFollowingMe:', isFollowingMe);
        }, 100);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      showToast('Please login to follow users', 'error');
      return;
    }

    try {
      setFollowLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Determine action based on current state
      const action = isFollowing ? 'unfollow' : 'follow';
      const method = isFollowing ? 'DELETE' : 'POST';
      
      console.log('🔄 Follow action START:', { 
        userId: params.id,
        currentUser: currentUser.id,
        currentlyFollowing: isFollowing,
        action,
        method,
        endpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/follow/${params.id}`
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${params.id}`, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📡 Follow response:', response.status, data);
      
      if (response.ok) {
        console.log('✅ Follow success, toggling state');
        
        // Toggle the follow state immediately
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        
        console.log('🔄 State toggled:', { 
          oldState: isFollowing, 
          newState: newFollowState,
          shouldShow: newFollowState ? 'UNFOLLOW' : 'FOLLOW'
        });
        
        // Update follower count
        setStats(prev => ({
          ...prev,
          followers: newFollowState ? prev.followers + 1 : prev.followers - 1
        }));
        
        showToast(newFollowState ? 'Now following' : 'Unfollowed', 'success');
      } else {
        console.error('❌ Follow action failed:', {
          status: response.status,
          message: data.message,
          currentState: isFollowing,
          attemptedAction: action
        });
        
        // If we get "Already following" error, force sync the state
        if (data.message?.includes('Already following')) {
          console.log('⚠️ State out of sync - fixing...');
          setIsFollowing(true); // Force the state to match reality
          showToast('You are already following this user', 'info');
        } else if (data.message?.includes('Not following')) {
          console.log('⚠️ State out of sync - fixing...');
          setIsFollowing(false); // Force the state to match reality
          showToast('You are not following this user', 'info');
        } else {
          showToast(data.message || 'Failed to update follow status', 'error');
        }
        
        // Reload profile to ensure state is synced
        setTimeout(() => {
          loadUserProfile();
        }, 300);
      }
    } catch (error) {
      console.error('❌ Follow error:', error);
      showToast('Failed to update follow status', 'error');
      // Reload to sync state after error
      setTimeout(() => {
        loadUserProfile();
      }, 300);
    } finally {
      setFollowLoading(false);
    }
  };

  const startChat = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // First, check if a chat already exists with this user
      const chatsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        const existingChat = (chatsData.data || chatsData || []).find((chat: any) => {
          const otherParticipant = chat.participants?.find((p: any) => p.userId !== currentUser?.id);
          return otherParticipant?.userId === params.id && chat.type === 'DIRECT';
        });
        
        if (existingChat) {
          // Chat exists, just open it
          console.log('✅ Found existing chat:', existingChat.id);
          router.push(`/chat?id=${existingChat.id}`);
          return;
        }
      }
      
      // No existing chat, create new one
      console.log('📝 Creating new chat with user:', params.id);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          type: 'DIRECT',
          participants: [params.id]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const chatId = data.data?.id || data.id;
        console.log('✅ Created new chat:', chatId);
        router.push(`/chat?id=${chatId}`);
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to start chat', 'error');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      showToast('Failed to start chat', 'error');
    }
  };

  const getUserInitials = () => {
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    return (user?.username?.[0] || 'U').toUpperCase();
  };

  const formatPrice = (price?: number, currency = 'NGN') => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isOwnProfile = currentUser?.id === params.id;
  const currentPosts = activeTab === 'market' ? marketListings : posts;

  return (
    <div className="min-h-screen bg-black">
      {/* VERSION BANNER - REMOVE AFTER CONFIRMING DEPLOYMENT */}
      <div className="bg-green-500 text-white text-center py-1 text-xs font-bold">
        🟢 VERSION 2.0 LOADED - Video Thumbnails Fixed
      </div>
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black border-b border-[#262626]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <IoArrowBack className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-1">
            <h1 className="text-white text-base font-semibold">{user?.firstName} {user?.lastName}</h1>
            {user && ((user as any)?.verificationBadge?.status === 'verified' || (user as any)?.verificationBadge?.status === 'active') && (
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <button className="p-2 -mr-2">
            <IoEllipsisHorizontal className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <div className="w-full">
        
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        ) : !user ? (
          <div className="py-20 text-center">
            <p className="text-gray-500">User not found</p>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="px-4 pt-3 pb-4">
              {/* Avatar & Stats Row */}
              <div className="flex items-center gap-6 mb-4">
                {/* Avatar with blue gradient ring */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-blue-500 to-slate-700">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1a1a] p-0.5">
                      {user.avatar ? (
                        <Image src={user.avatar} alt={user.username} width={80} height={80} className="w-full h-full rounded-full object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xl font-bold bg-[#2a2a2a]">
                          {getUserInitials()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* NO Verification Badge on Avatar - removed */}
                </div>

                {/* Stats */}
                <div className="flex flex-1 justify-around">
                  <div className="text-center">
                    <div className="text-white font-semibold">{stats.posts}</div>
                    <div className="text-gray-400 text-xs">Posts</div>
                  </div>
                  <Link href={`/user/${params.id}/followers`} className="text-center">
                    <div className="text-white font-semibold">{stats.followers}</div>
                    <div className="text-gray-400 text-xs">Followers</div>
                  </Link>
                  <Link href={`/user/${params.id}/following`} className="text-center">
                    <div className="text-white font-semibold">{stats.following}</div>
                    <div className="text-gray-400 text-xs">Following</div>
                  </Link>
                </div>
              </div>

              {/* Username, KYC Badge & Bio */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <h2 className="text-white text-sm font-semibold">{user.username}</h2>
                    {/* Blue verification badge - only if user has active verification badge */}
                    {((user as any)?.verificationBadge?.status === 'verified' || (user as any)?.verificationBadge?.status === 'active') && (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {user.isKYCVerified ? (
                    <div className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-md flex items-center gap-1">
                      <IoCheckmarkCircleOutline className="w-3 h-3 text-green-400" />
                      <span className="text-[10px] font-medium text-green-400">KYC Verified</span>
                    </div>
                  ) : (
                    <div className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-md flex items-center gap-1">
                      <IoCheckmarkCircleOutline className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] font-medium text-red-400">KYC Unverified</span>
                    </div>
                  )}
                  {/* Location Badge - Right after KYC */}
                  {(user.city || user.location || user.state) && (
                    <div className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-md flex items-center gap-1">
                      <IoLocationOutline className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] font-medium text-blue-400">
                        {user.city || user.location || user.state}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Bio */}
                {user.bio && (
                  <p className="text-white text-sm leading-relaxed mb-2 whitespace-pre-line">{user.bio}</p>
                )}
              </div>

              {/* Action Buttons */}
              {isOwnProfile ? (
                <div className="flex gap-2">
                  <Link href="/settings" className="flex-1">
                    <button className="w-full py-1.5 bg-[#262626] hover:bg-[#363636] text-white text-sm font-semibold rounded-lg transition-colors">
                      Edit Profile
                    </button>
                  </Link>
                  <button className="px-4 py-1.5 bg-[#262626] hover:bg-[#363636] text-white text-sm font-semibold rounded-lg transition-colors">
                    Share Profile
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {/* Single follow/unfollow button with dynamic text */}
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex-1 py-1.5 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                      isFollowing 
                        ? 'bg-[#262626] hover:bg-[#363636]' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {followLoading ? '...' : (
                      isFollowing ? 'Unfollow' : (isFollowingMe ? 'Follow Back' : 'Follow')
                    )}
                  </button>
                  
                  {/* Message button always visible */}
                  <button 
                    onClick={startChat}
                    className="px-4 py-1.5 bg-[#262626] hover:bg-[#363636] text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Message
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-t border-[#262626]">
              <button 
                onClick={() => setActiveTab('market')}
                className={`flex-1 py-3 flex items-center justify-center border-b transition-colors ${
                  activeTab === 'market' 
                    ? 'border-white' 
                    : 'border-transparent'
                }`}
              >
                <IoStorefrontOutline className={`w-6 h-6 ${activeTab === 'market' ? 'text-white' : 'text-gray-600'}`} />
              </button>
              <button 
                onClick={() => setActiveTab('social')}
                className={`flex-1 py-3 flex items-center justify-center border-b transition-colors ${
                  activeTab === 'social' 
                    ? 'border-white' 
                    : 'border-transparent'
                }`}
              >
                <IoNewspaperOutline className={`w-6 h-6 ${activeTab === 'social' ? 'text-white' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Content */}
            <div className="pb-20">
              {currentPosts.length === 0 ? (
                <div className="py-20 text-center">
                  {activeTab === 'market' ? (
                    <>
                      <IoStorefrontOutline className="w-16 h-16 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No market listings</p>
                    </>
                  ) : (
                    <>
                      <IoNewspaperOutline className="w-16 h-16 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No posts yet</p>
                    </>
                  )}
                </div>
              ) : activeTab === 'market' ? (
                <div className="px-2 pt-2 space-y-2">
                  {currentPosts.map((post) => (
                    <Link key={post.id} href={`/marketplace/${post.id}`}>
                      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                        <div className="flex gap-3 p-3">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-black flex-shrink-0 relative">
                            {post.images?.[0] ? (
                              <Image 
                                src={post.images[0]} 
                                alt={post.title} 
                                width={80} 
                                height={80} 
                                className="w-full h-full object-cover"
                                unoptimized
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.fallback-placeholder')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'fallback-placeholder flex items-center justify-center w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]';
                                    fallback.innerHTML = `
                                      <div class="text-center">
                                        <svg class="w-8 h-8 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    `;
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : post.videos?.[0] ? (
                              <div className="relative w-full h-full bg-black flex items-center justify-center">
                                {/* Simple black background with play icon */}
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <IoStorefrontOutline className="w-6 h-6 text-gray-700" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">{post.title}</h3>
                            {post.price && (
                              <p className="text-green-500 font-semibold text-sm mb-1">
                                {formatPrice(post.price, post.currency)}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-gray-500 text-xs">
                              <span>{post.views || 0} views</span>
                              <span>{post.likes || 0} likes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-px bg-black">
                  {currentPosts.map((post) => {
                    const hasImage = post.images?.[0];
                    const hasVideo = post.videos?.[0];
                    
                    // Check if text is emoji-only or very short
                    const text = post.title || post.description || '';
                    const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(text) && text.trim().length > 0;
                    const hasText = text.trim().length > 0;
                    
                    return (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div className="aspect-square bg-[#1a1a1a] relative overflow-hidden">
                          {hasImage ? (
                            <Image 
                              src={post.images![0]} 
                              alt="Post" 
                              fill 
                              className="object-cover" 
                              unoptimized 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.fallback-placeholder')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'fallback-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]';
                                  fallback.innerHTML = `
                                    <div class="text-center">
                                      <svg class="w-12 h-12 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <p class="text-gray-500 text-xs mt-2">Image unavailable</p>
                                    </div>
                                  `;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : hasVideo ? (
                            <div className="relative w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 overflow-hidden flex flex-col items-center justify-center">
                              {/* VERSION MARKER - If you see this, new code loaded */}
                              <div className="absolute top-1 right-1 bg-green-500 text-white text-[8px] px-1 rounded">v2</div>
                              
                              {/* Play icon */}
                              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
                                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                              <span className="text-white text-xs font-medium">VIDEO</span>
                            </div>
                          ) : hasText ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-3 relative border border-[#2f3336]">
                              {/* Decorative corner accents */}
                              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500/30"></div>
                              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500/30"></div>
                              
                              {/* Content - Emoji or Text */}
                              <div className="text-center space-y-1 z-10 w-full">
                                {isEmojiOnly ? (
                                  <div className="text-5xl leading-none">
                                    {text.trim()}
                                  </div>
                                ) : (
                                  <>
                                    {/* Quote icon at top for text posts */}
                                    <div className="absolute top-2 left-2">
                                      <svg className="w-4 h-4 text-blue-500/40" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                                      </svg>
                                    </div>
                                    {post.title && (
                                      <h3 className="text-white text-xs font-bold line-clamp-4 leading-tight px-1">
                                        {post.title}
                                      </h3>
                                    )}
                                    {post.description && !post.title && (
                                      <p className="text-gray-300 text-[10px] line-clamp-6 leading-snug px-1">
                                        {post.description}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Bottom indicator */}
                              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-full">
                                <IoNewspaperOutline className="w-2.5 h-2.5 text-blue-400" />
                                <span className="text-[7px] text-gray-300 font-semibold uppercase tracking-wider">
                                  {isEmojiOnly ? 'Emoji' : 'Text'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                              <IoNewspaperOutline className="w-8 h-8 text-gray-700" />
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
