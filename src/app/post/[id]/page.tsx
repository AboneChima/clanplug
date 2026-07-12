'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IoArrowBackOutline, IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareSocialOutline, IoBookmarkOutline, IoBookmark, IoSendOutline, IoCloseOutline, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  verificationBadge?: {
    status: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface Post {
  id: string;
  description: string;
  images?: string[];
  videos?: string[];
  type?: string;
  user: User;
  _count: { likes: number; comments: number };
  isLiked: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  comments?: Comment[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.id) {
      fetchPost();
      fetchComments();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPost(data.data || data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${params.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setPost({
        ...post,
        isLiked: !post.isLiked,
        _count: { ...post._count, likes: post.isLiked ? post._count.likes - 1 : post._count.likes + 1 }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setPost({ ...post, isBookmarked: !post.isBookmarked });
      showToast(post.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks', 'success');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText })
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments([data.data, ...comments]);
        setCommentText('');
        if (post) {
          setPost({ ...post, _count: { ...post._count, comments: post._count.comments + 1 } });
        }
      }
    } catch (error) {
      showToast('Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  };

  // Determine if description needs truncation
  const needsTruncation = post?.description && post.description.length > 100;
  const displayDescription = needsTruncation && !descriptionExpanded 
    ? post.description.substring(0, 100) + '...' 
    : post?.description;

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  // Check if it's a text-only post (no images or videos)
  const isTextOnly = !post.images?.length && !post.videos?.length;
  const hasVideo = post.videos && post.videos.length > 0;
  const hasImage = post.images && post.images.length > 0;

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      {/* Back Button - Fixed Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => router.back()}
          className="p-2 bg-black/60 backdrop-blur-md rounded-full hover:bg-black/80 transition-all"
        >
          <IoArrowBackOutline className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Main Content - Fullscreen Media or Text */}
      <div className={`h-full w-full flex items-center justify-center ${showComments ? 'h-1/2' : 'h-full'} transition-all duration-300`}>
        {/* Video Post */}
        {hasVideo && (
          <video
            src={post.videos![0]}
            className="w-full h-full object-contain bg-black"
            controls
            playsInline
            autoPlay
            loop
          />
        )}

        {/* Image Post */}
        {hasImage && !hasVideo && (
          <div className="relative w-full h-full">
            <Image
              src={post.images![0]}
              alt="Post"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}

        {/* Text-only Post - Story Style */}
        {isTextOnly && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-8">
            <div className="max-w-2xl text-center">
              <p className="text-white text-2xl md:text-3xl font-medium leading-relaxed">
                {post.description}
              </p>
            </div>
          </div>
        )}

        {/* Bottom-Left Overlay - User Info & Description */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
          <div className="pointer-events-auto max-w-xl">
            {/* User Info */}
            <Link href={`/user/${post.user.id}`} className="flex items-center gap-2 mb-2">
              {post.user.avatar ? (
                <Image 
                  src={post.user.avatar} 
                  alt={post.user.username} 
                  width={36} 
                  height={36} 
                  className="w-9 h-9 rounded-full border-2 border-white" 
                  unoptimized 
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center border-2 border-white">
                  <span className="text-white text-sm font-bold">{post.user.firstName[0]}</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-semibold text-sm">
                    {post.user.firstName} {post.user.lastName}
                  </span>
                  {(post.user.verificationBadge?.status === 'verified' || post.user.verificationBadge?.status === 'active') && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-300 text-xs">@{post.user.username}</span>
              </div>
            </Link>

            {/* Description - Only show for media posts */}
            {!isTextOnly && (
              <div className="text-white text-sm">
                <p className="mb-1">{displayDescription}</p>
                {needsTruncation && (
                  <button
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors"
                  >
                    {descriptionExpanded ? 'Show less' : 'more...'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Action Buttons */}
      <div className="absolute right-3 bottom-20 flex flex-col gap-5 z-20">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
        >
          {post.isLiked ? (
            <IoHeart className="w-7 h-7 text-red-500" />
          ) : (
            <IoHeartOutline className="w-7 h-7 text-white" />
          )}
          <span className="text-white text-xs font-semibold">{post._count.likes}</span>
        </button>

        {/* Comment */}
        <button
          onClick={toggleComments}
          className="flex flex-col items-center gap-1 p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
        >
          <IoChatbubbleOutline className="w-7 h-7 text-white" />
          <span className="text-white text-xs font-semibold">{post._count.comments}</span>
        </button>

        {/* Share */}
        <button
          onClick={() => {
            navigator.share?.({ 
              title: `Post by ${post.user.firstName}`, 
              url: window.location.href 
            }).catch(() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('Link copied!', 'success');
            });
          }}
          className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
        >
          <IoShareSocialOutline className="w-7 h-7 text-white" />
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
        >
          {post.isBookmarked ? (
            <IoBookmark className="w-7 h-7 text-yellow-500" />
          ) : (
            <IoBookmarkOutline className="w-7 h-7 text-white" />
          )}
        </button>
      </div>

      {/* Comments Slide-up Panel */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 transition-all duration-300 ease-in-out ${
          showComments ? 'h-1/2' : 'h-0'
        } overflow-hidden z-30`}
      >
        {/* Comments Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">
            Comments ({post._count.comments})
          </h2>
          <button
            onClick={toggleComments}
            className="p-2 hover:bg-gray-900 rounded-full transition-colors"
          >
            <IoChevronDown className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Comment Input */}
        <div className="p-3 border-b border-gray-800 bg-gray-950">
          <div className="flex gap-2">
            {user?.avatar ? (
              <Image 
                src={user.avatar} 
                alt={user.username} 
                width={32} 
                height={32} 
                className="w-8 h-8 rounded-full" 
                unoptimized 
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user?.firstName?.[0] || 'U'}</span>
              </div>
            )}
            <div className="flex-1 flex gap-2">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || submitting}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full transition-colors"
              >
                <IoSendOutline className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Comments List - Scrollable */}
        <div className="overflow-y-auto h-[calc(100%-140px)]">
          {comments.length === 0 ? (
            <div className="p-8 text-center">
              <IoChatbubbleOutline className="w-12 h-12 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No comments yet</p>
              <p className="text-gray-600 text-xs">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 border-b border-gray-900 hover:bg-gray-950 transition-colors">
                <div className="flex gap-3">
                  <Link href={`/user/${comment.user.id}`}>
                    {comment.user.avatar ? (
                      <Image 
                        src={comment.user.avatar} 
                        alt={comment.user.username} 
                        width={32} 
                        height={32} 
                        className="w-8 h-8 rounded-full" 
                        unoptimized 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{comment.user.firstName[0]}</span>
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <Link href={`/user/${comment.user.id}`} className="font-semibold text-white text-sm hover:underline">
                        {comment.user.firstName} {comment.user.lastName}
                      </Link>
                      {(comment.user.verificationBadge?.status === 'verified' || comment.user.verificationBadge?.status === 'active') && (
                        <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-gray-500 text-xs">@{comment.user.username}</span>
                      <span className="text-gray-600 text-xs">·</span>
                      <span className="text-gray-600 text-xs">
                        {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-white text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
