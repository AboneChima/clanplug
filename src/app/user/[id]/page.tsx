'use client';

import { useState, useEffect } from 'react';
import { IoArrowBack, IoGridOutline, IoHeartOutline, IoLocationOutline, IoBriefcaseOutline, IoCalendarOutline, IoEllipsisHorizontal } from 'react-icons/io5';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
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
  images?: string[];
  videos?: string[];
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ posts: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (params.id) loadUserProfile();
  }, [params.id]);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const [userRes, postsRes, followRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?userId=${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${params.id}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (userRes.ok) {
        const data = await userRes.json();
        setUser(data.data || data.user);
      }

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

      // Check if following
      if (currentUser?.id && params.id !== currentUser.id) {
        const followCheckRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${params.id}/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (followCheckRes.ok) {
          const data = await followCheckRes.json();
          setIsFollowing(data.isFollowing || false);
        }
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${params.id}`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setStats(prev => ({
          ...prev,
          followers: isFollowing ? prev.followers - 1 : prev.followers + 1
        }));
        showToast(isFollowing ? 'Unfollowed' : 'Following', 'success');
      }
    } catch (error) {
      showToast('Failed to update follow status', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return (user?.username?.[0] || 'U').toUpperCase();
  };

  const isOwnProfile = currentUser?.id === params.id;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-3 py-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <IoArrowBack className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-base font-semibold">{user?.username || 'Profile'}</h1>
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <IoEllipsisHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        ) : !user ? (
          <div className="py-20 text-center">
            <p className="text-slate-500">User not found</p>
          </div>
        ) : (
          <>
            {/* Profile Header - Compact */}
            <div className="px-3 pt-3 pb-2">
              {/* Avatar */}
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.username} width={80} height={80} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="text-center mb-3">
                <h2 className="text-white text-sm font-medium">@{user.username}</h2>
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

              {/* Action Buttons */}
              {isOwnProfile ? (
                <Link href="/settings">
                  <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors mb-3">
                    Edit Profile
                  </button>
                </Link>
              ) : (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      isFollowing
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-pink-600 hover:bg-pink-700 text-white'
                    }`}
                  >
                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors">
                    Message
                  </button>
                </div>
              )}

              {/* User Info - Compact */}
              <div className="space-y-1 text-xs">
                {user.city && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <IoLocationOutline className="w-3.5 h-3.5" />
                    <span>{user.city}, {user.state || user.country}</span>
                  </div>
                )}
                {user.bio && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <IoBriefcaseOutline className="w-3.5 h-3.5" />
                    <span className="line-clamp-2">{user.bio}</span>
                  </div>
                )}
                {user.createdAt && (
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
              {posts.length === 0 ? (
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
          </>
        )}

      </div>
    </div>
  );
}
