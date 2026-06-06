'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  IoArrowBackOutline,
  IoPersonOutline,
} from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

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

function FollowersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = searchParams.get('userId') || user?.id;

  useEffect(() => {
    if (userId) {
      loadFollowers();
    }
  }, [userId]);

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/follow/${userId}/followers`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.data || []);
      }
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (followUserId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${followUserId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setFollowers(followers.map(u => 
          u.id === followUserId ? { ...u, isFollowing: !u.isFollowing } : u
        ));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button onClick={() => router.back()} className="p-1.5 -ml-1 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <IoArrowBackOutline className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-sm font-semibold">Followers</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-16">
            <IoPersonOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No followers yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {followers.map((followUser) => (
              <div key={followUser.id} className="px-3 py-2.5 hover:bg-[#0a0a0a] transition-colors">
                <div className="flex items-center gap-3">
                  <Link href={`/user/${followUser.id}`}>
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
                    <Link href={`/user/${followUser.id}`}>
                      <div className="flex items-center gap-1">
                        <p className="text-white font-medium text-sm truncate">
                          {followUser.firstName} {followUser.lastName}
                        </p>
                        {(followUser.verificationBadge?.status === 'verified' || followUser.verificationBadge?.status === 'active') && (
                          <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs truncate">@{followUser.username}</p>
                    </Link>
                  </div>
                  {followUser.id !== user?.id && (
                    <button
                      onClick={() => handleFollowToggle(followUser.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
  );
}

export default function FollowersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <FollowersContent />
    </Suspense>
  );
}
