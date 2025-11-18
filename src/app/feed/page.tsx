'use client';

import { useState, useEffect } from 'react';
import {
  IoHeartOutline,
  IoHeart,
  IoChatbubbleOutline,
  IoShareSocialOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoImageOutline,
  IoPeopleOutline,
  IoMailOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

interface Post {
  id: string;
  title?: string;
  description: string;
  images?: string[];
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  type?: 'SOCIAL_POST' | 'MARKETPLACE_LISTING';
  listingId?: string;
  price?: number;
  category?: string;
}

// Helper function for authenticated API calls
async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response;
}

export default function FeedPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'forYou' | 'favorites' | 'following'>('forYou');
  const [followingUsers, setFollowingUsers] = useState<any[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [favoritePosts, setFavoritePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [viewingCommentsFor, setViewingCommentsFor] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (activeTab === 'forYou') {
      fetchPosts();
    } else if (activeTab === 'favorites') {
      fetchFavoritePosts();
    } else if (activeTab === 'following') {
      fetchFollowing();
    }
  }, [activeTab]);

  const fetchFollowing = async () => {
    if (!user?.id) {
      console.log('⚠️ No user ID, cannot fetch following');
      return;
    }
    try {
      setLoadingFollowing(true);
      console.log('🔍 Fetching following for user:', user.id);
      const response = await authFetch(`/api/follow/${user.id}/following`);
      console.log('📥 Following response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Following response data:', data);
        // The response structure is { success: true, data: [...users] }
        const followingList = data.data || [];
        console.log('✅ Following users:', followingList.length);
        setFollowingUsers(followingList);
      } else {
        const errorData = await response.json();
        console.error('❌ Following fetch error:', errorData);
        setFollowingUsers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching following:', error);
      setFollowingUsers([]);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Fetch social feed with TikTok-style algorithm
      const endpoint = '/api/posts/feed';
      const response = await authFetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const postsData = Array.isArray(data.data) ? data.data : Array.isArray(data.posts) ? data.posts : Array.isArray(data) ? data : [];
        
        // Fetch bookmarked posts from backend
        const bookmarksResponse = await authFetch('/api/posts/bookmarks');
        let bookmarkedIds: string[] = [];
        if (bookmarksResponse.ok) {
          const bookmarksData = await bookmarksResponse.json();
          const bookmarkedPosts = Array.isArray(bookmarksData.data) ? bookmarksData.data : [];
          bookmarkedIds = bookmarkedPosts.map((post: any) => post.id);
        }
        
        const postsWithBookmarks = postsData.map((post: Post) => ({
          ...post,
          isBookmarked: bookmarkedIds.includes(post.id),
          // Add timestamp to avatar to prevent caching
          user: {
            ...post.user,
            avatar: post.user.avatar ? `${post.user.avatar}?t=${Date.now()}` : undefined
          }
        }));
        
        setPosts(postsWithBookmarks);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoritePosts = async () => {
    try {
      setLoading(true);
      // Fetch bookmarked posts directly from backend
      const response = await authFetch('/api/posts/bookmarks');
      if (response.ok) {
        const data = await response.json();
        const postsData = Array.isArray(data.data) ? data.data : [];
        
        const postsWithBookmarks = postsData.map((post: Post) => ({
          ...post,
          isBookmarked: true,
          // Add timestamp to avatar to prevent caching
          user: {
            ...post.user,
            avatar: post.user.avatar ? `${post.user.avatar}?t=${Date.now()}` : undefined
          }
        }));
        
        setFavoritePosts(postsWithBookmarks);
      } else {
        setFavoritePosts([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavoritePosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      showToast('Please enter some content', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      let imageUrls: string[] = [];

      // Upload image if selected
      if (newPostImage) {
        const formData = new FormData();
        formData.append('media', newPostImage);

        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          console.log('Upload response:', uploadData);
          // Backend returns { success: true, data: { urls: [...] } }
          if (uploadData.success && uploadData.data?.urls?.length > 0) {
            imageUrls.push(...uploadData.data.urls);
          }
        } else {
          const errorData = await uploadResponse.json();
          console.error('Upload error:', errorData);
          showToast(errorData.message || 'Failed to upload image', 'error');
          return;
        }
      }
      
      // Create post data
      const postData = {
        title: newPostContent.substring(0, 100), // Use first 100 chars as title
        description: newPostContent,
        type: 'SOCIAL_POST',
        images: imageUrls,
        videos: []
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        showToast('Post created successfully!', 'success');
        setNewPostContent('');
        setNewPostImage(null);
        fetchPosts();
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to create post', 'error');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showToast('Error creating post', 'error');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await authFetch(`/api/posts/${postId}/like`, {
        method: 'POST',
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

  const handleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    try {
      const method = isCurrentlyFollowing ? 'DELETE' : 'POST';
      const endpoint = `/api/follow/${userId}`;
      
      const response = await authFetch(endpoint, {
        method,
      });

      if (response.ok) {
        // Update the post's user follow status
        setPosts(posts.map(post =>
          post.user.id === userId ? { ...post, user: { ...post.user, isFollowing: !isCurrentlyFollowing } as any } : post
        ));
        showToast(isCurrentlyFollowing ? 'Unfollowed successfully' : 'Followed successfully', 'success');
      } else {
        // Show actual error message from backend
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to update follow status', 'error');
      }
    } catch (error) {
      console.error('Error following user:', error);
      showToast('Failed to update follow status', 'error');
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      // Optimistically update UI
      const post = posts.find(p => p.id === postId);
      const favPost = favoritePosts.find(p => p.id === postId);
      const newBookmarkState = !post?.isBookmarked;
      
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, isBookmarked: newBookmarkState }
          : p
      ));
      
      setFavoritePosts(favoritePosts.map(p => 
        p.id === postId 
          ? { ...p, isBookmarked: newBookmarkState }
          : p
      ));
      
      // Sync with backend
      const response = await authFetch(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
      });
      
      if (response.ok) {
        showToast(newBookmarkState ? 'Added to favorites' : 'Removed from favorites', 'success');
        // Don't refresh - keep the optimistic update
      } else {
        // Revert on error
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, isBookmarked: !newBookmarkState }
            : p
        ));
        setFavoritePosts(favoritePosts.map(p => 
          p.id === postId 
            ? { ...p, isBookmarked: !newBookmarkState }
            : p
        ));
        showToast('Failed to update bookmark', 'error');
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      // Revert on error
      const post = posts.find(p => p.id === postId);
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, isBookmarked: !post?.isBookmarked }
          : p
      ));
      setFavoritePosts(favoritePosts.map(p => 
        p.id === postId 
          ? { ...p, isBookmarked: !post?.isBookmarked }
          : p
      ));
      showToast('Failed to update bookmark', 'error');
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) {
      showToast('Please enter a comment', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast('Comment posted!', 'success');
        setCommentText('');
        
        // Update comment count
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, _count: { ...post._count, comments: post._count.comments + 1 } }
            : post
        ));

        // Add new comment to the list if viewing comments
        if (viewingCommentsFor === postId) {
          setComments(prev => ({
            ...prev,
            [postId]: [data.data, ...(prev[postId] || [])]
          }));
        }
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to post comment', 'error');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      showToast('Error posting comment', 'error');
    }
  };

  const loadComments = async (postId: string) => {
    if (comments[postId]) {
      // Already loaded, just toggle view
      setViewingCommentsFor(viewingCommentsFor === postId ? null : postId);
      return;
    }

    try {
      setLoadingComments(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({
          ...prev,
          [postId]: data.data || []
        }));
        setViewingCommentsFor(postId);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleStartChat = async (userId: string, userInfo?: any) => {
    const { openChat } = await import('@/lib/chat-helper');
    const result = await openChat(userId, userInfo);
    
    if (!result.success) {
      showToast(result.error || 'Failed to open chat', 'error');
    }
  };

  const renderPost = (post: Post) => (
    <div key={post.id} className="bg-gray-800/50 rounded-md xs:rounded-lg border border-gray-700 overflow-hidden w-full">
      {/* Post Header - Extra Small for 0-360px */}
      <div className="p-1.5 xs:p-2.5 sm:p-3 flex items-center justify-between">
        <Link href={`/user/${post.user.id}`} className="flex items-center gap-1 xs:gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            {post.user.avatar ? (
              <Image 
                src={post.user.avatar} 
                alt={post.user.username} 
                width={32} 
                height={32} 
                className="w-6 h-6 xs:w-8 xs:h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 xs:w-8 xs:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-[9px] xs:text-xs font-semibold">
                  {post.user.firstName[0]}{post.user.lastName[0]}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-0.5 xs:gap-1">
              <p className="text-white text-[10px] xs:text-xs sm:text-sm font-medium truncate">{post.user.firstName} {post.user.lastName}</p>
              {(post.user as any)?.verificationBadge?.status === 'active' && (
                <svg className="w-2.5 h-2.5 xs:w-3.5 xs:h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-gray-400 text-[9px] xs:text-[11px] truncate">@{post.user.username}</p>
          </div>
        </Link>
        
        {/* Follow and Message buttons - Extra Small for 0-360px */}
        {post.user.id !== user?.id ? (
          <div className="flex items-center gap-0.5 xs:gap-1.5 flex-shrink-0">
            <button
              onClick={() => handleFollow(post.user.id, (post.user as any).isFollowing || false)}
              className={`px-1.5 xs:px-2.5 py-0.5 xs:py-1 text-[9px] xs:text-xs font-medium rounded transition-colors ${
                (post.user as any).isMutual ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {(post.user as any).isMutual ? 'Friends' : (post.user as any).isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={() => handleStartChat(post.user.id, post.user)}
              className="p-0.5 xs:p-1.5 hover:bg-gray-700 rounded transition-colors"
            >
              <IoMailOutline className="w-3 h-3 xs:w-4 xs:h-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to delete this post?')) {
                try {
                  const response = await authFetch(`/api/posts/${post.id}`, {
                    method: 'DELETE',
                  });
                  
                  if (response.ok) {
                    setPosts(posts.filter(p => p.id !== post.id));
                    showToast('Post deleted successfully', 'success');
                  } else {
                    showToast('Failed to delete post', 'error');
                  }
                } catch (error) {
                  console.error('Error deleting post:', error);
                  showToast('Error deleting post', 'error');
                }
              }
            }}
            className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors"
            title="Delete post"
          >
            <IoTrashOutline className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>

      {/* Post Content - Compact Layout */}
      {post.type === 'MARKETPLACE_LISTING' ? (
        /* Marketplace Listing - Horizontal Layout */
        <div className="px-3 pb-2">
          <div className="flex gap-2 sm:gap-3 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg p-2 border border-green-700/30">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
              {post.images && post.images[0] ? (
                <Image src={post.images[0]} alt="Listing image" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <IoImageOutline className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div className="absolute top-0.5 left-0.5 bg-green-600 text-white text-[9px] px-1 py-0.5 rounded font-medium">
                LISTING
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <p className="text-white font-medium text-xs sm:text-sm line-clamp-1">{post.title || 'Game Listing'}</p>
                <p className="text-gray-400 text-[11px] sm:text-xs line-clamp-2 mt-0.5">{post.description}</p>
                {post.price && (
                  <p className="text-green-400 font-bold text-xs sm:text-sm mt-0.5">₦{post.price.toLocaleString()}</p>
                )}
              </div>
              <Link
                href={`/marketplace/${post.listingId || post.id}`}
                className="text-blue-400 hover:text-blue-300 text-[11px] font-medium text-left inline-flex items-center gap-1 mt-1"
              >
                View Listing →
              </Link>
            </div>
          </div>
        </div>
      ) : post.images && post.images.length > 0 ? (
        /* Image Post - Extra Small for 0-360px */
        <div className="px-1.5 xs:px-2.5 sm:px-3 pb-1.5 xs:pb-2 flex gap-1.5 xs:gap-2.5 sm:gap-3">
          <button
            onClick={() => setViewingPost(post)}
            className="relative w-16 h-16 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-md xs:rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            <Image src={post.images[0]} alt="Post image" fill className="object-cover" />
            {post.images.length > 1 && (
              <div className="absolute top-0.5 right-0.5 xs:top-1 xs:right-1 bg-black/80 text-white text-[8px] xs:text-[10px] px-1 xs:px-1.5 py-0.5 rounded font-medium">
                +{post.images.length - 1}
              </div>
            )}
          </button>
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <p className="text-gray-300 text-[10px] xs:text-xs sm:text-sm line-clamp-4 leading-tight xs:leading-snug">{post.description}</p>
            <button
              onClick={() => setViewingPost(post)}
              className="text-blue-400 hover:text-blue-300 text-[9px] xs:text-[11px] font-medium mt-0.5 xs:mt-1 text-left inline-flex items-center gap-0.5"
            >
              <span>View</span>
              <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* Text Only Post - Extra Small for 0-360px */
        <div className="px-1.5 xs:px-2.5 sm:px-3 pb-1.5 xs:pb-2">
          <p className="text-gray-300 text-[10px] xs:text-xs sm:text-sm line-clamp-4 leading-tight xs:leading-snug">{post.description}</p>
        </div>
      )}

      {/* Post Actions */}
      <div className="px-3 py-2 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleLike(post.id)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors"
          >
            {post.isLiked ? (
              <IoHeart className="w-4 h-4 text-red-500" />
            ) : (
              <IoHeartOutline className="w-4 h-4" />
            )}
            <span className="text-xs">{post._count.likes}</span>
          </button>
          <button 
            onClick={() => {
              if (post._count.comments > 0) {
                loadComments(post.id);
              }
              setCommentingOnPost(commentingOnPost === post.id ? null : post.id);
            }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <IoChatbubbleOutline className="w-4 h-4" />
            <span className="text-xs">{post._count.comments}</span>
          </button>
          <button 
            onClick={() => {
              const postUrl = `${window.location.origin}/post/${post.id}`;
              if (navigator.share) {
                navigator.share({
                  title: post.title || 'Check out this post',
                  text: post.description,
                  url: postUrl
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(postUrl);
                showToast('Link copied to clipboard!', 'success');
              }
            }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 transition-colors"
          >
            <IoShareSocialOutline className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={() => handleBookmark(post.id)}
          className="text-gray-400 hover:text-yellow-500 transition-colors"
        >
          {post.isBookmarked ? (
            <IoBookmark className="w-4 h-4 text-yellow-500" />
          ) : (
            <IoBookmarkOutline className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Comments Section - Twitter Style */}
      {viewingCommentsFor === post.id && (
        <div className="border-t border-gray-700">
          {/* Existing Comments */}
          {loadingComments ? (
            <div className="px-3 py-4 text-center text-gray-400 text-sm">
              Loading comments...
            </div>
          ) : comments[post.id] && comments[post.id].length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {comments[post.id].map((comment: any) => (
                <div key={comment.id} className="px-3 py-3 border-b border-gray-700/50 hover:bg-gray-700/20">
                  <div className="flex gap-2">
                    <div className="flex-shrink-0">
                      {comment.user.avatar ? (
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {comment.user.firstName?.[0]}{comment.user.lastName?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">
                          {comment.user.firstName} {comment.user.lastName}
                        </span>
                        <span className="text-gray-400 text-xs">
                          @{comment.user.username}
                        </span>
                        <span className="text-gray-500 text-xs">
                          · {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-gray-400 text-sm">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      )}

      {/* Comment Input */}
      {commentingOnPost === post.id && (
        <div className="px-3 pb-3 border-t border-gray-700">
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 bg-gray-700/50 text-white text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleComment(post.id);
                }
              }}
            />
            <button
              onClick={() => handleComment(post.id)}
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-[200px] lg:pb-8">
        {/* TikTok-Style Compact Header - No Hero Section */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
          <div className="max-w-7xl mx-auto">
            {/* Top Row: Tabs Left + Icons Right */}
            <div className="flex items-center justify-between px-3 xs:px-4 py-2 xs:py-2.5">
              {/* Tabs - Left Aligned with Logo Font */}
              <div className="flex gap-4 xs:gap-6">
                <button
                  onClick={() => setActiveTab('forYou')}
                  className={`pb-1 px-1 text-sm xs:text-base font-bold tracking-tight transition-colors relative ${
                    activeTab === 'forYou' ? 'text-white' : 'text-gray-400'
                  }`}
                  style={{ fontFamily: 'Cal Sans, Inter, sans-serif' }}
                >
                  For You
                  {activeTab === 'forYou' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`pb-1 px-1 text-sm xs:text-base font-bold tracking-tight transition-colors relative ${
                    activeTab === 'favorites' ? 'text-white' : 'text-gray-400'
                  }`}
                  style={{ fontFamily: 'Cal Sans, Inter, sans-serif' }}
                >
                  Favorites
                  {activeTab === 'favorites' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                  )}
                </button>
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-1 xs:gap-1.5">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-1 xs:p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                  title="Search"
                >
                  <svg className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setCommentingOnPost('create-post-modal')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-md text-xs font-semibold"
                  title="Create Post"
                >
                  <span className="text-base font-bold leading-none">+</span>
                  <span>Post</span>
                </button>
              </div>
            </div>

            {/* Search Bar - Collapsible */}
            {showSearch && (
              <div className="px-3 xs:px-4 pb-2 relative z-[30]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={async (e) => {
                    const query = e.target.value;
                    setSearchQuery(query);
                    
                    if (query.trim().length > 1) {
                      setSearching(true);
                      try {
                        const token = localStorage.getItem('accessToken');
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (response.ok) {
                          const data = await response.json();
                          setSearchResults(data.data || data.users || []);
                        }
                      } catch (error) {
                        console.error('Search error:', error);
                      } finally {
                        setSearching(false);
                      }
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  placeholder="Search users..."
                  className="w-full px-4 py-2 bg-slate-700/50 text-white text-sm rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
                
                {/* Search Results Dropdown */}
                {searchQuery.trim().length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-[400px] overflow-y-auto z-[30]">
                    {searching ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-400 text-sm">Searching...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-6 text-center">
                        <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-gray-400 text-sm">No users found</p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {searchResults.map((user: any) => (
                          <Link
                            key={user.id}
                            href={`/user/${user.id}`}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/70 transition-all duration-200 border-b border-slate-700/50 last:border-0"
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                          >
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-600" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-1 ring-slate-600">
                                <span className="text-white text-xs font-bold">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-white font-medium text-sm truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                {user.verificationBadge?.status === 'active' && user.verificationBadge?.expiresAt && new Date(user.verificationBadge.expiresAt) > new Date() && (
                                  <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <p className="text-gray-400 text-xs truncate">@{user.username}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Full Width */}
        <div className="w-full px-0 pt-2 xs:pt-2.5 sm:pt-3">
          {activeTab === 'following' ? (
            /* Following View - Full Width */
            <div className="w-full space-y-2 xs:space-y-2.5 sm:space-y-3 px-2 xs:px-3 sm:px-4">
              {loadingFollowing ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading following...</p>
                </div>
              ) : followingUsers.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                  <IoPeopleOutline className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Not following anyone yet</p>
                  <p className="text-gray-500 text-sm mt-2">Start following users to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {followingUsers.map((followedUser: any) => (
                    <div key={followedUser.id} className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/user/${followedUser.id}`} className="flex-shrink-0">
                          {followedUser.avatar ? (
                            <Image 
                              src={followedUser.avatar} 
                              alt={followedUser.username} 
                              width={48} 
                              height={48} 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {followedUser.firstName?.[0]}{followedUser.lastName?.[0]}
                              </span>
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/user/${followedUser.id}`} className="hover:opacity-80">
                            <div className="flex items-center gap-1">
                              <p className="text-white font-medium truncate">
                                {followedUser.firstName} {followedUser.lastName}
                              </p>
                              {followedUser.isKYCVerified && (
                                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm truncate">@{followedUser.username}</p>
                          </Link>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFollow(followedUser.id, true)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              followedUser.isFriend 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                          >
                            {followedUser.isFriend ? 'Friends' : 'Following'}
                          </button>
                          <button
                            onClick={() => handleStartChat(followedUser.id, followedUser)}
                            className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
                          >
                            <IoMailOutline className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'favorites' ? (
            /* Favorites View - Full Width */
            <div className="w-full space-y-2 xs:space-y-2.5 sm:space-y-3 px-0">
              {loading ? (
                <div className="text-center py-10 xs:py-12">
                  <div className="animate-spin rounded-full h-10 w-10 xs:h-12 xs:w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-3 xs:mt-4 text-sm xs:text-base">Loading favorites...</p>
                </div>
              ) : favoritePosts.length === 0 ? (
                <div className="text-center py-10 xs:py-12 bg-gray-800/50 rounded-lg xs:rounded-xl border border-gray-700">
                  <IoBookmarkOutline className="w-12 h-12 xs:w-16 xs:h-16 text-gray-600 mx-auto mb-3 xs:mb-4" />
                  <p className="text-gray-400 text-sm xs:text-base">No favorite posts yet</p>
                  <p className="text-gray-500 text-xs xs:text-sm mt-2">Bookmark posts to see them here</p>
                </div>
              ) : (
                favoritePosts.map(renderPost)
              )}
            </div>
          ) : (
            <div className="w-full space-y-2 xs:space-y-2.5 sm:space-y-3 px-0">
              {/* Posts - Full Width */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 xs:h-12 xs:w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-3 xs:mt-4 text-sm xs:text-base">Loading feed...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-10 xs:py-12 bg-gray-800/50 rounded-lg xs:rounded-xl border border-gray-700">
                  <IoPeopleOutline className="w-12 h-12 xs:w-16 xs:h-16 text-gray-600 mx-auto mb-3 xs:mb-4" />
                  <p className="text-gray-400 text-sm xs:text-base">
                    No posts available right now. Be the first to post!
                  </p>
                </div>
              ) : (
                posts.map(renderPost)
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal - Compact */}
      {commentingOnPost === 'create-post-modal' && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3"
          onClick={() => setCommentingOnPost(null)}
        >
          <div 
            className="bg-slate-800 rounded-xl max-w-md w-full p-4 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">Create Post</h2>
              <button
                onClick={() => setCommentingOnPost(null)}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              {user?.avatar ? (
                <Image 
                  src={user.avatar} 
                  alt={user.username || 'User'} 
                  width={40} 
                  height={40} 
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-gray-400 text-xs">@{user?.username}</p>
              </div>
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-slate-700/50 text-white text-sm rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600 mb-3"
              rows={4}
              autoFocus
            />

            {newPostImage && (
              <div className="mb-3 relative">
                <img src={URL.createObjectURL(newPostImage)} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                <button
                  onClick={() => setNewPostImage(null)}
                  className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg cursor-pointer transition-colors">
                <IoImageOutline className="w-4 h-4" />
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Check verification status
                    try {
                      const token = localStorage.getItem('accessToken');
                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/status`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        if (data.data?.status !== 'active') {
                          showToast('Image posting is only available for verified accounts. Purchase verification badge to unlock.', 'error');
                          e.target.value = '';
                          return;
                        }
                      }
                    } catch (error) {
                      console.error('Error checking verification:', error);
                    }
                    
                    setNewPostImage(file);
                  }}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => {
                  handleCreatePost();
                  setCommentingOnPost(null);
                }}
                disabled={!newPostContent.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal - Mobile Optimized (Much Smaller) */}
      {viewingPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={() => setViewingPost(null)}
        >
          <div 
            className="relative bg-slate-800 rounded-lg sm:rounded-xl max-w-sm sm:max-w-2xl md:max-w-3xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingPost(null)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col md:flex-row max-h-[85vh] sm:max-h-[90vh]">
              {/* Image Section */}
              {viewingPost.images && viewingPost.images.length > 0 && (
                <div className="md:w-2/3 bg-black flex items-center justify-center relative">
                  <div className="relative w-full h-[40vh] sm:h-[50vh] md:aspect-auto md:h-[90vh]">
                    <Image
                      src={viewingPost.images[0]}
                      alt="Post image"
                      fill
                      className="object-contain"
                    />
                  </div>
                  {viewingPost.images.length > 1 && (
                    <div className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 sm:gap-1.5">
                      {viewingPost.images.map((_, idx) => (
                        <div key={idx} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/50" />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Content Section */}
              <div className="md:w-1/3 flex flex-col max-h-[45vh] sm:max-h-[50vh] md:max-h-[90vh]">
                {/* User Info */}
                <div className="p-3 sm:p-4 border-b border-gray-700">
                  <Link href={`/user/${viewingPost.user.id}`} className="flex items-center gap-2 sm:gap-3 hover:opacity-80">
                    {viewingPost.user.avatar ? (
                      <Image 
                        src={viewingPost.user.avatar} 
                        alt={viewingPost.user.username} 
                        width={36} 
                        height={36} 
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {viewingPost.user.firstName[0]}{viewingPost.user.lastName[0]}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-white font-medium text-sm sm:text-base truncate">{viewingPost.user.firstName} {viewingPost.user.lastName}</p>
                        {(viewingPost.user as any)?.verificationBadge?.status === 'active' && (
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm truncate">@{viewingPost.user.username}</p>
                    </div>
                  </Link>
                </div>
                
                {/* Description */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                  <p className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap">{viewingPost.description}</p>
                  <p className="text-gray-500 text-[10px] sm:text-xs mt-2 sm:mt-3">
                    {new Date(viewingPost.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="p-3 sm:p-4 border-t border-gray-700">
                  <div className="flex items-center justify-around">
                    <button
                      onClick={() => {
                        handleLike(viewingPost.id);
                        setViewingPost({...viewingPost, isLiked: !viewingPost.isLiked});
                      }}
                      className="flex flex-col items-center gap-0.5 sm:gap-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {viewingPost.isLiked ? (
                        <IoHeart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                      ) : (
                        <IoHeartOutline className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                      <span className="text-[10px] sm:text-xs">{viewingPost._count.likes}</span>
                    </button>
                    <button className="flex flex-col items-center gap-0.5 sm:gap-1 text-gray-400 hover:text-blue-500 transition-colors">
                      <IoChatbubbleOutline className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-[10px] sm:text-xs">{viewingPost._count.comments}</span>
                    </button>
                    <button 
                      onClick={() => handleBookmark(viewingPost.id)}
                      className="flex flex-col items-center gap-0.5 sm:gap-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      {viewingPost.isBookmarked ? (
                        <IoBookmark className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                      ) : (
                        <IoBookmarkOutline className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                      <span className="text-[10px] sm:text-xs">Save</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Overlay Modal (for backward compatibility) */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={viewingImage}
              alt="Full size image"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
