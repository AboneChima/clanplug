'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  IoGameControllerOutline,
  IoSearchOutline,
  IoAddOutline,
  IoCloseOutline,
  IoImageOutline,
  IoArrowBack,
  IoEyeOutline,
  IoHeartOutline,
  IoTimeOutline,
  IoCreateOutline,
  IoPricetagOutline,
  IoPersonOutline,
  IoTrashOutline,
  IoBookmarkOutline,
  IoBookmark,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

type Post = {
  id: string;
  title: string;
  description: string;
  type?: string;
  price?: number;
  currency?: string;
  gameTitle?: string;
  userId?: string;
  status?: string;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  views?: number;
  likes?: number;
  videos?: string[];
  images?: string[];
  isBookmarked?: boolean;
};

function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  
  const gameName = searchParams.get('game') || '';

  const handleBookmark = async (postId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
        ));
        showToast(posts.find(p => p.id === postId)?.isBookmarked ? 'Removed from saved' : 'Saved!', 'success');
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
      showToast('Failed to save', 'error');
    }
  };

  useEffect(() => {
    loadPosts();
  }, [gameName]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const postsData = Array.isArray(data.data) ? data.data : [];
        
        // Fetch bookmarked posts from backend
        const bookmarksResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/bookmarks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        let bookmarkedIds: string[] = [];
        if (bookmarksResponse.ok) {
          const bookmarksData = await bookmarksResponse.json();
          const bookmarkedPosts = Array.isArray(bookmarksData.data) ? bookmarksData.data : [];
          bookmarkedIds = bookmarkedPosts.map((post: any) => post.id);
        }
        
        console.log('All posts:', postsData.length);
        console.log('Game name from URL:', gameName);
        console.log('Posts with gameTitle:', postsData.filter((p: Post) => p.gameTitle).map((p: Post) => ({
          id: p.id,
          title: p.title,
          gameTitle: p.gameTitle,
          type: p.type
        })));
        
        // Filter by game name and add bookmark status
        const filtered = postsData
          .filter((p: Post) => 
            p.gameTitle?.toLowerCase().includes(gameName.toLowerCase()) &&
            p.type !== 'SOCIAL_POST'
          )
          .map((p: Post) => ({
            ...p,
            isBookmarked: bookmarkedIds.includes(p.id)
          }));
        
        console.log('Filtered posts:', filtered.length);
        setPosts(filtered);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showToast('Listing deleted successfully', 'success');
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        showToast('Failed to delete listing', 'error');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Error deleting listing', 'error');
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

  const filteredPosts = posts
    .filter(post => activeTab === 'all' || (activeTab === 'saved' && post.isBookmarked))
    .filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8">
        {/* Header - Ultra Compact for 0-360px, Compact for 360px+ */}
        <div className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm mb-2">
          <div className="max-w-7xl mx-auto px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2 sm:py-3">
            <button
              onClick={() => router.push('/posts')}
              className="inline-flex items-center gap-0.5 text-gray-400 hover:text-white mb-1 transition-colors"
            >
              <IoArrowBack className="w-3 h-3" />
              <span className="text-[10px] xs:text-xs">Back</span>
            </button>
            
            <div className="flex items-center justify-between gap-1.5 xs:gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-xs xs:text-sm sm:text-lg font-bold text-white mb-0 xs:mb-0.5 capitalize truncate">
                  {gameName.replace(/-/g, ' ')} Accounts
                </h1>
                <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400">{filteredPosts.length} listings</p>
              </div>
              <button
                onClick={() => router.push(`/marketplace/create?game=${gameName}`)}
                className="flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md sm:rounded-lg transition-colors text-[10px] xs:text-xs font-medium"
              >
                <IoAddOutline className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
                <span className="hidden xs:inline">Create</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-2 xs:px-2.5 sm:px-3">
          {/* Tabs - Ultra Compact for 0-360px, Compact for 360px+ */}
          <div className="flex gap-1 xs:gap-1.5 mb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 xs:px-2.5 py-1 xs:py-1.5 rounded-md sm:rounded-lg text-[10px] xs:text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-2 xs:px-2.5 py-1 xs:py-1.5 rounded-md sm:rounded-lg text-[10px] xs:text-xs font-medium transition-colors flex items-center gap-0.5 xs:gap-1 ${
                activeTab === 'saved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              <IoBookmark className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
              Saved
            </button>
          </div>

          {/* Search - Ultra Compact for 0-360px, Compact for 360px+ */}
          <div className="mb-2">
            <div className="relative max-w-2xl">
              <IoSearchOutline className="absolute left-2 xs:left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 xs:pl-8 sm:pl-9 pr-2 xs:pr-2.5 sm:pr-3 py-1.5 xs:py-1.5 sm:py-2 bg-slate-800/80 border border-slate-700 rounded-md sm:rounded-lg text-white text-xs xs:text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading listings...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <IoGameControllerOutline className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-3">No listings found</h3>
              <p className="text-gray-400 mb-8">Be the first to create a listing!</p>
              <button
                onClick={() => router.push(`/marketplace/create?game=${gameName}`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all"
              >
                <IoAddOutline className="w-5 h-5" />
                Create First Listing
              </button>
            </div>
          ) : (
            <div className={`grid gap-2 xs:gap-2.5 sm:gap-4 ${
              gameName.match(/tiktok|instagram|youtube|facebook|twitter|google|vpn/i)
                ? 'grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' // Portrait for social media
                : 'grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' // Landscape for games - 2 cols on mobile
            }`}>
              {filteredPosts.map((post) => {
                const isSocialMedia = gameName.match(/tiktok|instagram|youtube|facebook|twitter|google|vpn/i);
                return (
                <div
                  key={post.id}
                  className={`bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all group relative ${
                    post.status === 'SOLD' ? 'opacity-60' : ''
                  }`}
                >
                  {/* Video/Image Preview */}
                  <div className={`relative bg-slate-900 ${isSocialMedia ? 'aspect-[3/4]' : 'aspect-video'}`}>
                    {post.videos && post.videos.length > 0 ? (
                      <video
                        src={post.videos[0]}
                        className="w-full h-full object-contain bg-black"
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : post.images && post.images.length > 0 ? (
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <IoGameControllerOutline className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                    
                    {/* Sold Overlay */}
                    {post.status === 'SOLD' && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                        <div className="text-3xl font-bold text-red-500 line-through decoration-4">
                          SOLD
                        </div>
                      </div>
                    )}
                    
                    {/* Bookmark Button - Ultra Compact */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(post.id);
                      }}
                      className="absolute top-1.5 xs:top-2 sm:top-3 left-1.5 xs:left-2 sm:left-3 p-1 xs:p-1.5 sm:p-2 bg-black/80 backdrop-blur-sm rounded-md xs:rounded-lg border border-slate-600 hover:border-blue-500 transition-all z-10"
                    >
                      {post.isBookmarked ? (
                        <IoBookmark className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-blue-500" />
                      ) : (
                        <IoBookmarkOutline className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </button>
                    
                    {/* Price Badge - Ultra Compact */}
                    {post.price && (
                      <div className="absolute top-1.5 xs:top-2 sm:top-3 right-1.5 xs:right-2 sm:right-3 px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 sm:py-1.5 bg-black/80 backdrop-blur-sm rounded-md xs:rounded-lg border border-green-500/30">
                        <span className="text-green-400 font-bold text-[10px] xs:text-xs sm:text-sm">
                          {formatPrice(post.price, post.currency)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content - Ultra Compact for 0-360px, Compact for 360px+ */}
                  <div className="p-1.5 xs:p-2 sm:p-3">
                    {/* Seller Info - Ultra Compact */}
                    <div className="flex items-center gap-1 xs:gap-1.5 mb-1.5 xs:mb-2">
                      <div className="relative">
                        {post.user?.avatar ? (
                          <img 
                            src={post.user.avatar} 
                            alt={post.user.username}
                            className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-slate-600"
                          />
                        ) : (
                          <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-[10px] xs:text-xs font-semibold">
                              {post.user?.firstName?.[0] || 'U'}
                            </span>
                          </div>
                        )}
                        {/* Verification Badge */}
                        {(post.user as any)?.verificationBadge?.status === 'active' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                            <svg className="w-1.5 h-1.5 xs:w-2 xs:h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-0.5 xs:gap-1">
                          <p className="text-white text-[10px] xs:text-xs sm:text-sm font-medium truncate">
                            {post.user?.firstName} {post.user?.lastName}
                          </p>
                          {(post.user as any)?.verificationBadge?.status === 'active' && (
                            <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-gray-400 text-[9px] xs:text-[10px] sm:text-xs truncate">
                          @{post.user?.username}
                        </p>
                      </div>
                    </div>

                    {/* Title - Ultra Compact */}
                    <h3 className="text-white font-semibold text-[10px] xs:text-xs sm:text-sm mb-1 xs:mb-1.5 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h3>

                    {/* Stats - Ultra Compact */}
                    <div className="flex items-center justify-between text-gray-400 text-[9px] xs:text-[10px] sm:text-xs mb-1.5 xs:mb-2">
                      <div className="flex items-center gap-1 xs:gap-1.5">
                        <span className="flex items-center gap-0.5">
                          <IoEyeOutline className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                          {post.views || 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <IoHeartOutline className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                          {post.likes || 0}
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5">
                        <IoTimeOutline className="w-3 h-3" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>

                    {/* Action Buttons - Compact */}
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => router.push(`/marketplace/${post.id}`)}
                        className="flex-1 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        <span>View</span>
                        <IoCreateOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      
                      {/* Delete button for owner */}
                      {post.userId === user?.id && (
                        <button 
                          onClick={() => deletePost(post.id)}
                          className="px-2 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                          title="Delete listing"
                        >
                          <IoTrashOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    }>
      <ListingsContent />
    </Suspense>
  );
}
