'use client';

import { useState, useEffect } from 'react';
import { IoCreateOutline, IoStorefrontOutline, IoNewspaperOutline, IoLocationOutline, IoBriefcaseOutline, IoCalendarOutline, IoEyeOutline, IoHeartOutline, IoTimeOutline, IoPricetagOutline, IoPersonOutline, IoCloseOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserStats {
  posts: number;
  followers: number;
  following: number;
}

interface FollowUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isFollowing?: boolean;
  verificationBadge?: {
    status: string;
  };
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
  createdAt: string;
  views?: number;
  likes?: number;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({ posts: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [marketListings, setMarketListings] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'social'>('market');
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers');
  const [followUsers, setFollowUsers] = useState<FollowUser[]>([]);
  const [loadingFollows, setLoadingFollows] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

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
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${user.id}&limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${user.id}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        const postsList = Array.isArray(data.data) ? data.data : [];
        
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

    // Show preview immediately
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
        console.log('Avatar upload response:', data);
        const newAvatarUrl = data.user?.avatar || data.avatar || data.data?.url;
        
        if (newAvatarUrl) {
          const timestampedUrl = `${newAvatarUrl}?t=${Date.now()}`;
          updateUser({ avatar: timestampedUrl });
          setAvatarPreview(timestampedUrl);
          showToast('Profile picture updated!', 'success');
        } else {
          console.error('No avatar URL in response:', data);
          showToast('Avatar uploaded but URL not found', 'error');
          setAvatarPreview(user?.avatar || '');
        }
      } else {
        const error = await response.json();
        console.error('Avatar upload failed:', error);
        showToast(error.message || 'Failed to update profile picture', 'error');
        setAvatarPreview(user?.avatar || '');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showToast('Failed to update profile picture', 'error');
      setAvatarPreview(user?.avatar || '');
    } finally {
      setIsUploading(false);
    }
  };

  const getUserInitials = () => {
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    return (user?.username?.[0] || 'U').toUpperCase();
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/user/${user?.id}`;
    const shareText = `Check out ${user?.firstName} ${user?.lastName}'s profile on Clanplug!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.firstName} ${user?.lastName} - Clanplug`,
          text: shareText,
          url: profileUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl);
        showToast('Profile link copied to clipboard!', 'success');
      } catch (error) {
        console.error('Clipboard error:', error);
        showToast('Failed to copy link', 'error');
      }
    }
  };

  const openFollowModal = async (type: 'followers' | 'following') => {
    setFollowModalType(type);
    setShowFollowModal(true);
    setLoadingFollows(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/follow/${user?.id}/${type}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setFollowUsers(data.data || []);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
    } finally {
      setLoadingFollows(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setFollowUsers(followUsers.map(u => 
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
        ));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleDeletePost = async (postId: string, postType: string) => {
    if (!confirm(`Are you sure you want to delete this ${postType === 'SOCIAL_POST' ? 'post' : 'listing'}? This action cannot be undone.`)) {
      return;
    }

    setDeletingPostId(postId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Remove from the appropriate list
        if (postType === 'SOCIAL_POST') {
          setPosts(posts.filter(p => p.id !== postId));
        } else {
          setMarketListings(marketListings.filter(p => p.id !== postId));
        }
        setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
        showToast('Deleted successfully!', 'success');
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to delete', 'error');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Error deleting post', 'error');
    } finally {
      setDeletingPostId(null);
    }
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

  const currentPosts = activeTab === 'market' ? marketListings : posts;

  return (
    <AppShell>
      <div className="min-h-screen bg-black">
        {/* Profile Container */}
        <div className="w-full min-h-screen pb-16">
          
          {/* Header */}
          <div className="px-4 pt-3 pb-4">
            {/* Avatar & Stats Row */}
            <div className="flex items-center gap-6 mb-4">
              {/* Avatar with gradient ring */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-blue-500 to-slate-700">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1a1a] p-0.5">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt={user?.username || 'User'} width={80} height={80} className="w-full h-full rounded-full object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xl font-bold bg-[#2a2a2a]">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* NO Verification Badge on Avatar - removed */}
                
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-1 justify-around">
                <div className="text-center">
                  <div className="text-white font-semibold">{stats.posts}</div>
                  <div className="text-gray-400 text-xs">Posts</div>
                </div>
                <button 
                  onClick={() => router.push(`/followers?userId=${user?.id}`)}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <div className="text-white font-semibold">{stats.followers}</div>
                  <div className="text-gray-400 text-xs">Followers</div>
                </button>
                <button 
                  onClick={() => router.push(`/following?userId=${user?.id}`)}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <div className="text-white font-semibold">{stats.following}</div>
                  <div className="text-gray-400 text-xs">Following</div>
                </button>
              </div>
            </div>

            {/* Username & Bio */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-1">
                <h1 className="text-white text-sm font-semibold">{user?.username}</h1>
                
                {/* Blue Verification Badge - Only for verified users */}
                {((user as any)?.verificationBadge?.status === 'verified' || (user as any)?.verificationBadge?.status === 'active') ? (
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <button
                    onClick={() => router.push('/verification-badge')}
                    className="text-blue-500 hover:text-blue-400 text-xs font-medium transition-colors"
                  >
                    Get verified
                  </button>
                )}
              </div>
              
              {/* Bio */}
              {user?.bio && (
                <p className="text-white text-sm leading-relaxed mb-2 whitespace-pre-line">{user.bio}</p>
              )}
              
              {/* Location */}
              {((user as any)?.location || user?.city) && (
                <p className="text-gray-400 text-xs mb-2">📍 {(user as any)?.location || user?.city}</p>
              )}
              
              {/* KYC Status Badge */}
              <div className="flex items-center gap-2">
                {user?.isKYCVerified ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-600/20 border border-green-500/30 rounded-full">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] text-green-400 font-semibold">KYC Verified</span>
                  </div>
                ) : (user as any)?.kycStatus === 'PENDING' ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-600/20 border border-yellow-500/30 rounded-full">
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] text-yellow-400 font-semibold">KYC Pending</span>
                  </div>
                ) : (
                  <Link href="/kyc">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-600/20 border border-red-500/30 rounded-full hover:bg-red-600/30 transition-colors cursor-pointer">
                      <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px] text-red-400 font-semibold">KYC Unverified</span>
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link href="/settings" className="flex-1">
                <button className="w-full py-2 bg-[#262626] hover:bg-[#363636] text-white text-sm font-semibold rounded-lg transition-colors">
                  Edit Profile
                </button>
              </Link>
              <button 
                onClick={handleShareProfile}
                className="px-4 py-2 bg-[#262626] hover:bg-[#363636] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Share
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-[#262626] sticky top-0 bg-black z-10">
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
          <div>
            {loading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              </div>
            ) : currentPosts.length === 0 ? (
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
                  <div key={post.id} className="bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#252525] transition-colors relative">
                    <Link href={`/marketplace/${post.id}`} className="block">
                      <div className="flex gap-2 p-2">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0 relative">
                          {post.images?.[0] ? (
                            <Image 
                              src={post.images[0]} 
                              alt={post.title} 
                              width={64} 
                              height={64} 
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : post.videos?.[0] ? (
                            <div className="relative w-full h-full bg-black">
                              <video 
                                src={`${post.videos[0]}#t=0.1`}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                                poster={post.videos[0]}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-6 h-6 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                                  <svg className="w-3 h-3 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <IoStorefrontOutline className="w-6 h-6 text-gray-700" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center pr-8">
                          <h3 className="text-white font-medium text-xs mb-1 line-clamp-1">{post.title}</h3>
                          {post.description && (
                            <p className="text-gray-400 text-[10px] line-clamp-1 mb-1">{post.description}</p>
                          )}
                          {post.price && (
                            <p className="text-green-500 font-semibold text-xs">
                              {formatPrice(post.price, post.currency)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                    {/* Delete Button - Always visible at top right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeletePost(post.id, post.type || 'MARKETPLACE_LISTING');
                      }}
                      disabled={deletingPostId === post.id}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-700 disabled:opacity-50 text-white rounded-md transition-colors z-10 shadow-lg"
                      title="Delete listing"
                    >
                      {deletingPostId === post.id ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 448 512">
                          <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-px bg-black">
                {currentPosts.map((post) => {
                  const media = post.images?.[0] || post.videos?.[0];
                  
                  // Check if text is emoji-only or very short
                  const text = post.title || post.description || '';
                  const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(text) && text.trim().length > 0;
                  const hasText = text.trim().length > 0;
                  
                  return (
                    <div key={post.id} className="relative">
                      <Link href={`/post/${post.id}`} className="block">
                        <div className="aspect-square bg-[#1a1a1a] relative overflow-hidden">
                          {media ? (
                            <Image src={media} alt="Post" fill className="object-cover" unoptimized />
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
                      {/* Delete Button - Always visible at top right */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeletePost(post.id, post.type || 'SOCIAL_POST');
                        }}
                        disabled={deletingPostId === post.id}
                        className="absolute top-1 right-1 p-1.5 bg-red-600/90 hover:bg-red-700 disabled:opacity-50 text-white rounded-md transition-colors z-10 shadow-lg"
                        title="Delete post"
                      >
                        {deletingPostId === post.id ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 448 512">
                            <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Follow Modal */}
      {showFollowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowFollowModal(false)}>
          <div className="bg-[#1a1a1a] border border-[#2f3336] rounded-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2f3336]">
              <h2 className="text-white font-bold text-lg capitalize">{followModalType}</h2>
              <button
                onClick={() => setShowFollowModal(false)}
                className="p-2 hover:bg-[#2a2a2a] rounded-full transition-colors"
              >
                <IoCloseOutline className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loadingFollows ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : followUsers.length === 0 ? (
                <div className="text-center py-12">
                  <IoPersonOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No {followModalType} yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2f3336]">
                  {followUsers.map((followUser) => (
                    <div key={followUser.id} className="p-4 hover:bg-[#0a0a0a] transition-colors">
                      <div className="flex items-center gap-3">
                        <Link href={`/user/${followUser.id}`} onClick={() => setShowFollowModal(false)}>
                          {followUser.avatar ? (
                            <Image
                              src={followUser.avatar}
                              alt={followUser.username}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {followUser.firstName[0]}{followUser.lastName[0]}
                              </span>
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/user/${followUser.id}`} onClick={() => setShowFollowModal(false)}>
                            <div className="flex items-center gap-1">
                              <p className="text-white font-semibold text-sm truncate">
                                {followUser.firstName} {followUser.lastName}
                              </p>
                              {(followUser.verificationBadge?.status === 'verified' || followUser.verificationBadge?.status === 'active') && (
                                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs truncate">@{followUser.username}</p>
                          </Link>
                        </div>
                        {followUser.id !== user?.id && (
                          <button
                            onClick={() => handleFollowToggle(followUser.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                              followUser.isFollowing
                                ? 'bg-[#2a2a2a] text-white hover:bg-red-600/20 hover:text-red-500'
                                : 'bg-white text-black hover:bg-gray-200'
                            }`}
                          >
                            {followUser.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
