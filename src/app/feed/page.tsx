'use client';

import { useState, useEffect } from 'react';
import { IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareSocialOutline, IoBookmarkOutline, IoBookmark, IoCloseOutline, IoTrashOutline, IoEllipsisVerticalOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

interface Post {
  id: string;
  description: string;
  images?: string[];
  type?: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  _count: { likes: number; comments: number };
  isLiked: boolean;
  isBookmarked?: boolean;
  createdAt: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKYCBanner, setShowKYCBanner] = useState(true);
  const [activeTab, setActiveTab] = useState<'forYou' | 'bookmarks'>('forYou');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/feed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const postsData = Array.isArray(data.data) ? data.data : [];
        const socialPosts = postsData.filter((p: Post) => !p.type || p.type === 'SOCIAL_POST');
        setPosts(socialPosts);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !post.isLiked, _count: { ...post._count, likes: post.isLiked ? post._count.likes - 1 : post._count.likes + 1 }}
          : post
      ));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post
      ));
      showToast(posts.find(p => p.id === postId)?.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks', 'success');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        showToast('Post deleted successfully', 'success');
      } else {
        showToast('Failed to delete post', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to delete post', 'error');
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-black">
        {/* KYC Banner */}
        {!user?.isKYCVerified && showKYCBanner && (
          <div className="bg-[#1a1a1a] border-b border-[#333] p-2">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium">Complete your KYC</p>
                <p className="text-gray-400 text-[10px]">Verify to unlock all features</p>
              </div>
              <Link href="/kyc">
                <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                  Verify
                </button>
              </Link>
              <button onClick={() => setShowKYCBanner(false)} className="p-1 text-gray-500 hover:text-white flex-shrink-0">
                <IoCloseOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="max-w-2xl mx-auto border-x border-[#2f3336]">
          {/* Tabs with Post Button */}
          <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-[#2f3336]">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex-1 flex">
                <button
                  onClick={() => setActiveTab('forYou')}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors relative ${
                    activeTab === 'forYou' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  For You
                  {activeTab === 'forYou' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={`flex-1 py-2 text-sm font-semibold transition-colors relative ${
                    activeTab === 'bookmarks' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Bookmarks
                  {activeTab === 'bookmarks' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full"></div>
                  )}
                </button>
              </div>
              <Link href="/create-post">
                <button className="ml-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="divide-y divide-[#2f3336]">
              {posts
                .filter(post => activeTab === 'forYou' || post.isBookmarked)
                .map((post) => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <div className="p-3 hover:bg-[#080808] transition-colors cursor-pointer">
                    <div className="flex gap-2">
                      {/* Avatar */}
                      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex-shrink-0">
                        <Link href={`/user/${post.user.id}`}>
                          {post.user.avatar ? (
                            <Image src={post.user.avatar} alt={post.user.username} width={36} height={36} className="w-9 h-9 rounded-full" unoptimized />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{post.user.firstName[0]}</span>
                            </div>
                          )}
                        </Link>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white text-xs">{post.user.firstName} {post.user.lastName}</span>
                          {((post.user as any).verificationBadge?.status === 'verified' || (post.user as any).verificationBadge?.status === 'active') && (
                            <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                            <span className="text-gray-500 text-[10px]">@{post.user.username}</span>
                          </div>
                          
                          {/* Delete button - only show for own posts */}
                          {post.user.id === user?.id && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(post.id);
                              }}
                              className="p-1 hover:bg-red-500/10 rounded-full transition-colors"
                              title="Delete post"
                            >
                              <IoTrashOutline className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          )}
                        </div>

                        <p className="text-white text-xs mb-2 whitespace-pre-wrap line-clamp-3">{post.description}</p>

                        {post.images && post.images[0] && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-[#2f3336]">
                            <Image src={post.images[0]} alt="Post" width={600} height={400} className="w-full" unoptimized />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between max-w-xs" onClick={(e) => e.preventDefault()}>
                          <Link href={`/post/${post.id}`}>
                            <button className="flex items-center gap-1.5 text-gray-300 hover:text-blue-500 transition-colors p-1.5 hover:bg-blue-500/10 rounded-full">
                              <IoChatbubbleOutline className="w-[18px] h-[18px]" />
                              <span className="text-xs font-medium">{post._count.comments}</span>
                            </button>
                          </Link>

                          <button onClick={(e) => { e.stopPropagation(); handleLike(post.id); }} className="flex items-center gap-1.5 text-gray-300 hover:text-pink-500 transition-colors p-1.5 hover:bg-pink-500/10 rounded-full">
                            {post.isLiked ? <IoHeart className="w-[18px] h-[18px] text-pink-500" /> : <IoHeartOutline className="w-[18px] h-[18px]" />}
                            <span className="text-xs font-medium">{post._count.likes}</span>
                          </button>

                          <button className="text-gray-300 hover:text-green-500 transition-colors p-1.5 hover:bg-green-500/10 rounded-full">
                            <IoShareSocialOutline className="w-[18px] h-[18px]" />
                          </button>

                          <button onClick={(e) => { e.stopPropagation(); handleBookmark(post.id); }} className="text-gray-300 hover:text-blue-500 transition-colors p-1.5 hover:bg-blue-500/10 rounded-full">
                            {post.isBookmarked ? <IoBookmark className="w-[18px] h-[18px] text-blue-500" /> : <IoBookmarkOutline className="w-[18px] h-[18px]" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
