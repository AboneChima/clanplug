'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  IoArrowBack,
  IoShieldCheckmarkOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoEyeOutline,
  IoHeartOutline,
  IoShareOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoTrophyOutline,
  IoStarOutline,
  IoGameControllerOutline,
  IoWarningOutline,
  IoCheckmarkCircleOutline,
  IoChatbubbleOutline,
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
  category?: string;
  gameTitle?: string;
  userId: string;
  status?: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  views?: number;
  likes?: number;
  videos?: string[];
  images?: string[];
  accountRank?: string;
  accountRegion?: string;
  accountAge?: string;
  hasRareItems?: boolean;
  isVerified?: boolean;
  _count?: {
    comments: number;
  };
};

export default function MarketplaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadPost(params.id as string);
    }
  }, [params.id]);

  const loadPost = async (postId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPost(data.data);
      } else {
        showToast('Failed to load listing', 'error');
        router.push('/posts');
      }
    } catch (error) {
      console.error('Error loading post:', error);
      showToast('Error loading listing', 'error');
      router.push('/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      showToast('Please login to purchase', 'error');
      router.push('/login');
      return;
    }

    if (post?.userId === user.id) {
      showToast('You cannot buy your own listing', 'error');
      return;
    }

    setShowEscrowModal(true);
  };

  const handleCreateEscrow = async () => {
    if (!post || !user) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/escrow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: post.userId,
          postId: post.id,
          amount: post.price,
          currency: post.currency || 'NGN',
          title: `Purchase: ${post.title}`,
          description: post.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast('Escrow created! Redirecting to payment...', 'success');
        router.push(`/escrow/${data.data.id}`);
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to create escrow', 'error');
      }
    } catch (error) {
      console.error('Error creating escrow:', error);
      showToast('Error creating escrow', 'error');
    }
  };

  const handleMarkAsSold = async () => {
    if (!post || !user || post.userId !== user.id) return;

    if (!confirm('Are you sure you want to mark this listing as sold?')) return;

    try {
      setMarkingSold(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'SOLD',
        }),
      });

      if (response.ok) {
        showToast('Listing marked as sold!', 'success');
        setPost({ ...post, status: 'SOLD' });
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to mark as sold', 'error');
      }
    } catch (error) {
      console.error('Error marking as sold:', error);
      showToast('Error marking as sold', 'error');
    } finally {
      setMarkingSold(false);
    }
  };

  const formatPrice = (price?: number, currency = 'NGN') => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (!post) {
    return (
      <AppShell>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white text-xl">Listing not found</p>
            <button
              onClick={() => router.push('/posts')}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 lg:pb-8">
        {/* Header */}
        <div className="bg-slate-900/50 border-b border-slate-800 mb-3">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
            <button
              onClick={() => router.push('/posts')}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <IoArrowBack className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-2 sm:space-y-4">
              {/* Video/Image - Compact */}
              <div className="bg-slate-800/50 rounded-md sm:rounded-lg overflow-hidden border border-slate-700 relative">
                <div className="relative aspect-video bg-black">
                  {post.videos && post.videos.length > 0 ? (
                    <video
                      src={post.videos[0]}
                      className="w-full h-full object-contain"
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
                    <div className="w-full h-full flex items-center justify-center">
                      <IoGameControllerOutline className="w-16 h-16 sm:w-24 sm:h-24 text-gray-600" />
                    </div>
                  )}
                  
                  {/* Sold Overlay */}
                  {post.status === 'SOLD' && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl sm:text-6xl font-bold text-red-500 mb-2 line-through decoration-4">
                          SOLD
                        </div>
                        <p className="text-white text-lg">This listing is no longer available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Details - Compact */}
              <div className="bg-slate-800/50 rounded-md sm:rounded-lg p-2 sm:p-4 lg:p-6 border border-slate-700">
                <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1.5 sm:mb-2">{post.title}</h1>

                {/* Tags - Smaller */}
                <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                  {post.gameTitle && (
                    <span className="px-2 py-0.5 bg-blue-600/20 border border-blue-600/30 rounded-md text-blue-400 text-xs font-medium">
                      🎮 {post.gameTitle}
                    </span>
                  )}
                  {post.category && (
                    <span className="px-2 py-0.5 bg-purple-600/20 border border-purple-600/30 rounded-md text-purple-400 text-xs font-medium">
                      {post.category.replace('_', ' ')}
                    </span>
                  )}
                  {post.accountRank && (
                    <span className="px-2 py-0.5 bg-yellow-600/20 border border-yellow-600/30 rounded-md text-yellow-400 text-xs font-medium flex items-center gap-1">
                      <IoTrophyOutline className="w-3 h-3" />
                      {post.accountRank}
                    </span>
                  )}
                  {post.hasRareItems && (
                    <span className="px-2 py-0.5 bg-orange-600/20 border border-orange-600/30 rounded-md text-orange-400 text-xs font-medium flex items-center gap-1">
                      <IoStarOutline className="w-3 h-3" />
                      Rare Items
                    </span>
                  )}
                </div>

                {/* Description - Compact */}
                <div className="mb-2 sm:mb-3">
                  <h2 className="text-xs sm:text-sm font-semibold text-white mb-1">Description</h2>
                  <p className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap line-clamp-3">{post.description}</p>
                </div>

                {/* Account Details */}
                {post.category === 'GAME_ACCOUNT' && (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    {post.accountRegion && (
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Region</p>
                        <p className="text-white text-sm font-medium flex items-center gap-1">
                          <IoLocationOutline className="w-3 h-3" />
                          {post.accountRegion}
                        </p>
                      </div>
                    )}
                    {post.accountAge && (
                      <div>
                        <p className="text-gray-400 text-xs mb-0.5">Account Age</p>
                        <p className="text-white text-sm font-medium flex items-center gap-1">
                          <IoCalendarOutline className="w-3 h-3" />
                          {post.accountAge}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-400 text-xs mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700">
                  <span className="flex items-center gap-1 sm:gap-2">
                    <IoEyeOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline">{post.views || 0} views</span>
                    <span className="xs:hidden">{post.views || 0}</span>
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <IoHeartOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline">{post.likes || 0} likes</span>
                    <span className="xs:hidden">{post.likes || 0}</span>
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <IoTimeOutline className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{formatDate(post.createdAt)}</span>
                    <span className="sm:hidden">{formatDate(post.createdAt).split(',')[0]}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar - Compact */}
            <div className="space-y-2 sm:space-y-3">
              {/* Price & Buy - Compact */}
              <div className="bg-slate-800/50 rounded-md sm:rounded-lg p-2 sm:p-3 border border-slate-700 lg:sticky lg:top-6">
                <div className="mb-2 sm:mb-3">
                  <p className="text-gray-400 text-[10px] sm:text-xs mb-0.5">Price</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-400">
                    {formatPrice(post.price, post.currency)}
                  </p>
                </div>

                {post.status === 'SOLD' ? (
                  <div className="w-full py-2 bg-gray-600 text-white text-xs sm:text-sm font-semibold rounded-md text-center mb-2">
                    Sold Out
                  </div>
                ) : post.userId === user?.id ? (
                  <button
                    onClick={handleMarkAsSold}
                    disabled={markingSold}
                    className="w-full py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-md transition-all mb-2"
                  >
                    {markingSold ? 'Marking...' : 'Mark as Sold'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleBuyNow}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold rounded-md transition-all mb-1.5"
                    >
                      Buy with Escrow
                    </button>
                    <button
                      onClick={async () => {
                        if (!user) {
                          showToast('Please login to message seller', 'error');
                          router.push('/login');
                          return;
                        }
                        
                        try {
                          const token = localStorage.getItem('accessToken');
                          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              type: 'DIRECT',
                              participants: [post.userId],
                            }),
                          });

                          if (response.ok) {
                            const data = await response.json();
                            router.push(`/chat?chatId=${data.data.id}`);
                          } else {
                            const error = await response.json();
                            showToast(error.message || 'Failed to start chat', 'error');
                          }
                        } catch (error) {
                          console.error('Error creating chat:', error);
                          showToast('Failed to start chat', 'error');
                        }
                      }}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 mb-2"
                    >
                      <IoChatbubbleOutline className="w-4 h-4" />
                      <span>Message Seller</span>
                    </button>
                  </>
                )}

                {/* Escrow Info - Compact */}
                <div className="p-2 bg-blue-600/10 border border-blue-600/30 rounded-md">
                  <div className="flex items-start gap-1.5">
                    <IoShieldCheckmarkOutline className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium text-[10px] sm:text-xs mb-0.5">Secure Escrow</p>
                      <p className="text-gray-400 text-[10px] sm:text-xs leading-tight">
                        Payment held until confirmed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seller Info - Compact */}
              <div className="bg-slate-800/50 rounded-md sm:rounded-lg p-2 sm:p-3 border border-slate-700">
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-1.5 sm:mb-2">Seller</h3>
                
                <div className="flex items-center gap-1.5 mb-2">
                  {post.user.avatar ? (
                    <img
                      src={post.user.avatar}
                      alt={post.user.username}
                      className="w-8 h-8 rounded-full object-cover border-2 border-slate-600"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {post.user.firstName[0]}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-xs sm:text-sm font-medium truncate">
                      {post.user.firstName} {post.user.lastName}
                    </p>
                    <p className="text-gray-400 text-[10px] sm:text-xs truncate">@{post.user.username}</p>
                  </div>
                </div>

                {post.isVerified && (
                  <div className="flex items-center gap-1.5 text-green-400 text-xs mb-2">
                    <IoCheckmarkCircleOutline className="w-4 h-4" />
                    <span>Verified</span>
                  </div>
                )}
              </div>

              {/* Safety Tips */}
              <div className="bg-slate-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700">
                <div className="flex items-center gap-1.5 text-yellow-400 mb-2">
                  <IoWarningOutline className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Safety Tips</h3>
                </div>
                <ul className="space-y-1.5 text-gray-400 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Always use escrow for secure transactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Verify account details before confirming</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Change password immediately after purchase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Report any suspicious activity</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Escrow Confirmation Modal */}
        {showEscrowModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-white mb-4">Confirm Purchase</h2>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Item</p>
                  <p className="text-white font-medium">{post.title}</p>
                </div>
                
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Price</p>
                  <p className="text-white font-medium text-lg">
                    {formatPrice(post.price, post.currency)}
                  </p>
                </div>

                <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <IoShieldCheckmarkOutline className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium text-sm mb-1">Escrow Protection</p>
                      <p className="text-gray-400 text-xs">
                        Payment will be held securely until you confirm receipt
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEscrowModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEscrow}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
