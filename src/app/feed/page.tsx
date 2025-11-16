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
        
        // Load bookmarked state from localStorage
        const bookmarkedIds = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
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
      // Get bookmarked IDs from localStorage
      const bookmarkedIds = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
      
      if (bookmarkedIds.length === 0) {
        setFavoritePosts([]);
        setLoading(false);
        return;
      }
      
      // Fetch all posts and filter by bookmarked IDs
      const endpoint = '/api/posts/feed';
      const response = await authFetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const postsData = Array.isArray(data.data) ? data.data : Array.isArray(data.posts) ? data.posts : Array.isArray(data) ? data : [];
        
        // Filter to only bookmarked posts
        const bookmarked = postsData.filter((post: Post) => bookmarkedIds.includes(post.id));
        const postsWithBookmarks = bookmarked.map((post: Post) => ({
          ...post,
          isBookmarked: true
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
      const newBookmarkState = !post?.isBookmarked;
      
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, isBookmarked: newBookmarkState }
          : p
      ));
      
      // Save to localStorage as fallback
      const bookmarkedIds = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
      if (newBookmarkState) {
        bookmarkedIds.push(postId);
      } else {
        const index = bookmarkedIds.indexOf(postId);
        if (index > -1) bookmarkedIds.splice(index, 1);
      }
      localStorage.setItem('bookmarkedPosts', JSON.stringify(bookmarkedIds));
      
      showToast(newBookmarkState ? 'Added to favorites' : 'Removed from favorites', 'success');
      
      // Try to sync with backend (will fail gracefully if table doesn't exist)
      try {
        await authFetch(`/api/posts/${postId}/bookmark`, {
          method: 'POST',
        });
      } catch (err) {
        console.log('Backend bookmark sync failed, using localStorage');
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
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
    <div key={post.id} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
      {/* Post Header */}
      <div className="p-3 flex items-center justify-between">
        <Link href={`/user/${post.user.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="relative">
            {post.user.avatar ? (
              <Image 
                src={post.user.avatar} 
                alt={post.user.username} 
                width={32} 
                height={32} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {post.user.firstName[0]}{post.user.lastName[0]}
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-white text-sm font-medium">{post.user.firstName} {post.user.lastName}</p>
              {(post.user as any)?.isKYCVerified && (
                <div className="flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-xs">@{post.user.username}</p>
          </div>
        </Link>
        
        {/* Follow and Message buttons - only show if not own post */}
        {post.user.id !== user?.id ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleFollow(post.user.id, (post.user as any).isFollowing || false)}
              className="px-3 py-1 text-xs font-medium rounded-md transition-colors bg-blue-600 hover:bg-blue-700 text-white"
            >
              {(post.user as any).isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={() => handleStartChat(post.user.id, post.user)}
              className="p-1.5 hover:bg-gray-700 rounded-md transition-colors"
            >
              <IoMailOutline className="w-4 h-4 text-gray-400" />
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
        /* Image Post - Horizontal Layout */
        <div className="px-3 pb-2 flex gap-2 sm:gap-3">
          <button
            onClick={() => setViewingPost(post)}
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            <Image src={post.images[0]} alt="Post image" fill className="object-cover" />
            {post.images.length > 1 && (
              <div className="absolute top-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                +{post.images.length - 1}
              </div>
            )}
          </button>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <p className="text-gray-300 text-xs sm:text-sm line-clamp-3">{post.description}</p>
            <button
              onClick={() => setViewingPost(post)}
              className="text-blue-400 hover:text-blue-300 text-[11px] font-medium mt-1 text-left"
            >
              View Details →
            </button>
          </div>
        </div>
      ) : (
        /* Text Only Post */
        <div className="px-3 pb-2">
          <p className="text-gray-300 text-sm line-clamp-3">{post.description}</p>
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
          <button className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 transition-colors">
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
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-4">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-white mb-1">Dashboard</h1>
                <p className="text-xs sm:text-base text-white/90">Your social feed</p>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg transition-colors border border-white/30"
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.username} 
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-white/50"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-white/50">
                    <span className="text-xs font-bold text-white">
                      {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <span className="hidden sm:inline text-sm sm:text-base font-medium">Profile</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex gap-6 sm:gap-8">
              <button
                onClick={() => setActiveTab('forYou')}
                className={`pb-3 px-2 text-sm sm:text-base font-semibold transition-colors relative ${
                  activeTab === 'forYou' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                For You
                {activeTab === 'forYou' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`pb-3 px-2 text-sm sm:text-base font-semibold transition-colors relative ${
                  activeTab === 'favorites' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Favorites
                {activeTab === 'favorites' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`pb-3 px-2 text-sm sm:text-base font-semibold transition-colors relative ${
                  activeTab === 'following' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Following
                {activeTab === 'following' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'following' ? (
            /* Following View */
            <div className="w-full max-w-3xl mx-auto space-y-3">
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
            /* Favorites View */
            <div className="w-full max-w-3xl mx-auto space-y-3">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading favorites...</p>
                </div>
              ) : favoritePosts.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                  <IoBookmarkOutline className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No favorite posts yet</p>
                  <p className="text-gray-500 text-sm mt-2">Bookmark posts to see them here</p>
                </div>
              ) : (
                favoritePosts.map(renderPost)
              )}
            </div>
          ) : (
            /* For You Feed */
            <div className="w-full max-w-3xl mx-auto space-y-3">
              {/* Create Post - Compact */}
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex gap-2">
                  {user?.avatar ? (
                    <Image 
                      src={user.avatar} 
                      alt={user.username || 'User'} 
                      width={32} 
                      height={32} 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full bg-gray-700/50 text-white text-sm rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={2}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 cursor-pointer text-xs">
                        <IoImageOutline className="w-4 h-4" />
                        <span className="hidden sm:inline">Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewPostImage(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={handleCreatePost}
                        disabled={!newPostContent.trim()}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post
                      </button>
                    </div>
                    {newPostImage && (
                      <p className="text-green-500 text-xs mt-1">✓ {newPostImage.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Posts */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading feed...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                  <IoPeopleOutline className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
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

      {/* Post Detail Modal */}
      {viewingPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setViewingPost(null)}
        >
          <div 
            className="relative bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingPost(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col md:flex-row max-h-[90vh]">
              {/* Image Section */}
              {viewingPost.images && viewingPost.images.length > 0 && (
                <div className="md:w-2/3 bg-black flex items-center justify-center relative">
                  <div className="relative w-full aspect-square md:aspect-auto md:h-[90vh]">
                    <Image
                      src={viewingPost.images[0]}
                      alt="Post image"
                      fill
                      className="object-contain"
                    />
                  </div>
                  {viewingPost.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {viewingPost.images.map((_, idx) => (
                        <div key={idx} className="w-2 h-2 rounded-full bg-white/50" />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Content Section */}
              <div className="md:w-1/3 flex flex-col max-h-[50vh] md:max-h-[90vh]">
                {/* User Info */}
                <div className="p-4 border-b border-gray-700">
                  <Link href={`/user/${viewingPost.user.id}`} className="flex items-center gap-3 hover:opacity-80">
                    {viewingPost.user.avatar ? (
                      <Image 
                        src={viewingPost.user.avatar} 
                        alt={viewingPost.user.username} 
                        width={40} 
                        height={40} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {viewingPost.user.firstName[0]}{viewingPost.user.lastName[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{viewingPost.user.firstName} {viewingPost.user.lastName}</p>
                      <p className="text-gray-400 text-sm">@{viewingPost.user.username}</p>
                    </div>
                  </Link>
                </div>
                
                {/* Description */}
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{viewingPost.description}</p>
                  <p className="text-gray-500 text-xs mt-3">
                    {new Date(viewingPost.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex items-center justify-around">
                    <button
                      onClick={() => {
                        handleLike(viewingPost.id);
                        setViewingPost({...viewingPost, isLiked: !viewingPost.isLiked});
                      }}
                      className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {viewingPost.isLiked ? (
                        <IoHeart className="w-6 h-6 text-red-500" />
                      ) : (
                        <IoHeartOutline className="w-6 h-6" />
                      )}
                      <span className="text-xs">{viewingPost._count.likes}</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors">
                      <IoChatbubbleOutline className="w-6 h-6" />
                      <span className="text-xs">{viewingPost._count.comments}</span>
                    </button>
                    <button 
                      onClick={() => handleBookmark(viewingPost.id)}
                      className="flex flex-col items-center gap-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      {viewingPost.isBookmarked ? (
                        <IoBookmark className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <IoBookmarkOutline className="w-6 h-6" />
                      )}
                      <span className="text-xs">Save</span>
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
