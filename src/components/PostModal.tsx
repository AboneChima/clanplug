"use client";

import { useEffect, useState } from 'react';
import { 
  IoClose, 
  IoHeartOutline, 
  IoHeart, 
  IoChatbubbleOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoSendOutline
} from 'react-icons/io5';

interface PostModalProps {
  postId: string;
  onClose: () => void;
}

interface Post {
  id: string;
  description: string;
  images?: string[];
  videos?: string[];
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
  isBookmarked: boolean;
  createdAt: string;
}

export default function PostModal({ postId, onClose }: PostModalProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    fetchPost();
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jobica-backend.onrender.com';
      
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPost(data.data || data);
      } else {
        setError('Failed to load post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jobica-backend.onrender.com';
      
      // Optimistic update
      setPost({
        ...post,
        isLiked: !post.isLiked,
        _count: {
          ...post._count,
          likes: post.isLiked ? post._count.likes - 1 : post._count.likes + 1
        }
      });

      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Revert on error
        setPost({
          ...post,
          isLiked: post.isLiked,
          _count: {
            ...post._count,
            likes: post._count.likes
          }
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jobica-backend.onrender.com';
      
      // Optimistic update
      setPost({
        ...post,
        isBookmarked: !post.isBookmarked
      });

      const response = await fetch(`${API_URL}/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Revert on error
        setPost({
          ...post,
          isBookmarked: post.isBookmarked
        });
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post) return;
    
    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('accessToken');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://jobica-backend.onrender.com';
      
      const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText }),
      });

      if (response.ok) {
        // Update comment count
        setPost({
          ...post,
          _count: {
            ...post._count,
            comments: post._count.comments + 1
          }
        });
        setCommentText('');
      }
    } catch (error) {
      console.error('Error commenting:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900 rounded-lg max-[360px]:rounded-none sm:rounded-xl max-w-2xl w-full max-[360px]:h-full max-h-[98vh] sm:max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between max-[360px]:p-2 p-2.5 sm:p-4 border-b border-slate-700 bg-slate-800/50 flex-shrink-0">
          <h2 className="max-[360px]:text-sm text-base sm:text-lg font-bold text-white">Post</h2>
          <button
            onClick={onClose}
            className="max-[360px]:w-7 max-[360px]:h-7 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
          >
            <IoClose className="max-[360px]:w-3.5 max-[360px]:h-3.5 w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading post...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          ) : post ? (
            <div className="max-[360px]:p-2 p-2.5 sm:p-4">
              {/* Compact User Info */}
              <div className="flex items-center max-[360px]:gap-1.5 gap-2 sm:gap-3 max-[360px]:mb-2 mb-2.5 sm:mb-4">
                {post.user.avatar ? (
                  <img
                    src={post.user.avatar}
                    alt={post.user.username}
                    className="max-[360px]:w-8 max-[360px]:h-8 w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="max-[360px]:w-8 max-[360px]:h-8 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white max-[360px]:text-xs text-sm sm:text-base font-semibold">
                      {post.user.firstName?.[0]}{post.user.lastName?.[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white max-[360px]:text-xs text-sm sm:text-base font-semibold">
                    {post.user.firstName} {post.user.lastName}
                  </p>
                  <p className="text-gray-400 max-[360px]:text-[10px] text-xs sm:text-sm">@{post.user.username}</p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-white max-[360px]:text-xs max-[360px]:leading-tight text-sm sm:text-base max-[360px]:mb-2 mb-2.5 sm:mb-4 whitespace-pre-wrap">{post.description}</p>

              {/* Compact Media */}
              {post.images && post.images.length > 0 && (
                <div className="max-[360px]:mb-2 mb-2.5 sm:mb-4 max-[360px]:rounded-md rounded-lg sm:rounded-xl overflow-hidden">
                  <img
                    src={post.images[0]}
                    alt="Post"
                    className="w-full h-auto max-[360px]:max-h-48 max-h-64 sm:max-h-96 object-cover"
                  />
                </div>
              )}

              {post.videos && post.videos.length > 0 && (
                <div className="max-[360px]:mb-2 mb-2.5 sm:mb-4 max-[360px]:rounded-md rounded-lg sm:rounded-xl overflow-hidden">
                  <video
                    src={post.videos[0]}
                    controls
                    className="w-full h-auto max-[360px]:max-h-48 max-h-64 sm:max-h-96"
                  />
                </div>
              )}

              {/* Interactive Stats */}
              <div className="flex items-center max-[360px]:gap-3 gap-4 sm:gap-6 max-[360px]:py-1.5 py-2 sm:py-3 border-t border-slate-700 text-gray-400">
                <button 
                  onClick={handleLike}
                  className="flex items-center max-[360px]:gap-1 gap-1.5 sm:gap-2 hover:text-red-500 transition-colors active:scale-95"
                >
                  {post.isLiked ? (
                    <IoHeart className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                  ) : (
                    <IoHeartOutline className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                  <span className="max-[360px]:text-[10px] text-xs sm:text-sm">{post._count.likes}</span>
                </button>
                
                <button className="flex items-center max-[360px]:gap-1 gap-1.5 sm:gap-2 hover:text-blue-500 transition-colors">
                  <IoChatbubbleOutline className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="max-[360px]:text-[10px] text-xs sm:text-sm">{post._count.comments}</span>
                </button>
                
                <button 
                  onClick={handleBookmark}
                  className="flex items-center max-[360px]:gap-1 gap-1.5 sm:gap-2 hover:text-yellow-500 transition-colors ml-auto active:scale-95"
                >
                  {post.isBookmarked ? (
                    <IoBookmark className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                  ) : (
                    <IoBookmarkOutline className="max-[360px]:w-4 max-[360px]:h-4 w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>
              </div>

              {/* Timestamp */}
              <p className="text-gray-500 max-[360px]:text-[9px] text-[10px] sm:text-xs max-[360px]:mt-0.5 mt-1 sm:mt-2">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>

        {/* Comment Input - Fixed at bottom */}
        {post && (
          <div className="border-t border-slate-700 max-[360px]:p-1.5 p-2 sm:p-3 bg-slate-800/50 flex-shrink-0">
            <div className="flex max-[360px]:gap-1 gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !submittingComment) {
                    handleComment();
                  }
                }}
                placeholder="Write a comment..."
                className="flex-1 max-[360px]:px-2 max-[360px]:py-1.5 max-[360px]:text-xs px-3 py-2 text-sm bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || submittingComment}
                className="max-[360px]:px-2 max-[360px]:py-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 max-[360px]:text-xs text-sm font-medium"
              >
                {submittingComment ? (
                  <div className="animate-spin max-[360px]:w-3 max-[360px]:h-3 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <IoSendOutline className="max-[360px]:w-3 max-[360px]:h-3 w-4 h-4" />
                    <span className="hidden sm:inline">Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
