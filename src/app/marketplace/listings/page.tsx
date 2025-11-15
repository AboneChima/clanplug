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
  
  const gameName = searchParams.get('game') || '';

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
        
        console.log('All posts:', postsData.length);
        console.log('Game name from URL:', gameName);
        console.log('Posts with gameTitle:', postsData.filter((p: Post) => p.gameTitle).map((p: Post) => ({
          id: p.id,
          title: p.title,
          gameTitle: p.gameTitle,
          type: p.type
        })));
        
        // Filter by game name
        const filtered = postsData.filter((p: Post) => 
          p.gameTitle?.toLowerCase().includes(gameName.toLowerCase()) &&
          p.type !== 'SOCIAL_POST'
        );
        
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

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-8">
        {/* Header */}
        <div className="bg-slate-900/50 border-b border-slate-800 mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <button
              onClick={() => router.push('/posts')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <IoArrowBack className="w-5 h-5" />
              <span>Back to Marketplace</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 capitalize">
                  {gameName.replace(/-/g, ' ')} Accounts
                </h1>
                <p className="text-sm text-gray-400">{filteredPosts.length} listings available</p>
              </div>
              <button
                onClick={() => router.push(`/marketplace/create?game=${gameName}`)}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <IoAddOutline className="w-5 h-5" />
                <span className="hidden sm:inline">Create Listing</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-2xl">
              <IoSearchOutline className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all group relative ${
                    post.status === 'SOLD' ? 'opacity-60' : ''
                  }`}
                >
                  {/* Video Preview */}
                  <div className="relative aspect-video bg-slate-900">
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
                    
                    {/* Price Badge */}
                    {post.price && (
                      <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg border border-green-500/30">
                        <span className="text-green-400 font-bold text-sm">
                          {formatPrice(post.price, post.currency)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Seller Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative">
                        {post.user?.avatar ? (
                          <img 
                            src={post.user.avatar} 
                            alt={post.user.username}
                            className="w-8 h-8 rounded-full object-cover border-2 border-slate-600"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {post.user?.firstName?.[0] || 'U'}
                            </span>
                          </div>
                        )}
                        {/* Verification Badge */}
                        {(post.user as any)?.isKYCVerified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-white text-sm font-medium truncate">
                            {post.user?.firstName} {post.user?.lastName}
                          </p>
                          {(post.user as any)?.isKYCVerified && (
                            <span className="text-blue-400 text-xs font-semibold">✓</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs truncate">
                          @{post.user?.username}
                        </p>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-semibold text-base mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h3>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-gray-400 text-xs mb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <IoEyeOutline className="w-3.5 h-3.5" />
                          {post.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <IoHeartOutline className="w-3.5 h-3.5" />
                          {post.likes || 0}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <IoTimeOutline className="w-3.5 h-3.5" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/marketplace/${post.id}`)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <span>View Details</span>
                        <IoCreateOutline className="w-4 h-4" />
                      </button>
                      
                      {/* Delete button for owner */}
                      {post.userId === user?.id && (
                        <button 
                          onClick={() => deletePost(post.id)}
                          className="px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                          title="Delete listing"
                        >
                          <IoTrashOutline className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
