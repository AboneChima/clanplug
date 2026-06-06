'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IoArrowBack, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

interface Follower {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isKYCVerified?: boolean;
  verificationBadge?: {
    status: string;
  };
}

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowers();
  }, [params.id]);

  const loadFollowers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${params.id}/followers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFollowers(data.data || data.followers || []);
      }
    } catch (error) {
      console.error('Error loading followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (user: Follower) => {
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    return (user.username?.[0] || 'U').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button onClick={() => router.back()} className="p-1.5 -ml-1 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <IoArrowBack className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-sm font-semibold">Followers</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto"></div>
          </div>
        ) : followers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 text-sm">No followers yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {followers.map((follower) => (
              <Link key={follower.id} href={`/user/${follower.id}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#0a0a0a] transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-blue-600 via-blue-500 to-slate-700">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1a1a] p-0.5">
                        {follower.avatar ? (
                          <Image 
                            src={follower.avatar} 
                            alt={follower.username} 
                            width={40} 
                            height={40} 
                            className="w-full h-full rounded-full object-cover" 
                            unoptimized 
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#2a2a2a] flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{getUserInitials(follower)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {(follower.verificationBadge?.status === 'verified' || follower.verificationBadge?.status === 'active') && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-black">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="text-white text-sm font-medium truncate">
                        {follower.firstName} {follower.lastName}
                      </h3>
                      {follower.isKYCVerified && (
                        <IoCheckmarkCircleOutline className="w-3 h-3 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-500 text-xs truncate">@{follower.username}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
