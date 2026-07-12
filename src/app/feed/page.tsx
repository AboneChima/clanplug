'use client';

import { useState, useEffect, useRef } from 'react';
import { IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareSocialOutline, IoBookmarkOutline, IoBookmark, IoChevronDown, IoChevronUp, IoSendOutline } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
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

export default function FeedPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

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

  const fetchComments = async (postId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments`, {
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
    const post = posts[currentIndex];
    if (!post) return;

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setPosts(posts.map((p, i) => 
        i === currentIndex 
          ? { ...p, isLiked: !p.isLiked, _count: { ...p._count, likes: p.isLiked ? p._count.likes - 1 : p._count.likes + 1 }}
          : p
      ));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleBookmark = async () => {
    const post = posts[currentIndex];
    if (!post) return;

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setPosts(posts.map((p, i) => 
        i === currentIndex ? { ...p, isBookmarked: !p.isBookmarked } : p
      ));
      showToast(post.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks', 'success');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleComment = async () => {
    const post = posts[currentIndex];
    if (!commentText.trim() || submitting || !post) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}/comments`, {
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
        setPosts(posts.map((p, i) => 
          i === currentIndex ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 }} : p
        ));
      }
    } catch (error) {
      showToast('Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      fetchComments(posts[currentIndex]?.id);
    }
    setShowComments(!showComments);
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentIndex < posts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowComments(false);
      setDescriptionExpanded(false);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowComments(false);
      setDescriptionExpanded(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') handleScroll('down');
      if (e.key === 'ArrowUp') handleScroll('up');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts.length]);

  // Touch swipe for mobile
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        handleScroll('down');
      } else {
        handleScroll('up');
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-8">
        <p className="text-gray-500 text-lg mb-4">No posts yet</p>
        <Link href="/create-post">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors">
            Create your first post
          </button>
        </Link>
      </div>
    );
  }

  const currentPost = posts[currentIndex];
  if (!currentPost) return null;

  const hasVideo = currentPost.videos && currentPost.videos.length > 0;
  const hasImage = currentPost.images && currentPost.images.length > 0;
  const isTextOnly = !hasVideo && !hasImage;
  const needsTruncation = currentPost.description && currentPost.description.length > 100;
  const displayDescription = needsTruncation && !descriptionExpanded 
    ? currentPost.description.substring(0, 100) + '...' 
    : currentPost.description;

  return (
    <div 
      ref={containerRef}
      className="h-screen bg-black relative overflow-hidden snap-y snap-mandatory"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={() => handleScroll('up')}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60vh] z-40 p-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
        >
          <IoChevronUp className="w-6 h-6 text-white" />
        </button>
      )}
      {currentIndex < posts.length - 1 && (
        <button
          onClick={() => handleScroll('down')}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[50vh] z-40 p-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
        >
          <IoChevronDown className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Post Counter */}
      <div className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {posts.length}
        </span>
      </div>

      {/* Main Content - Fullscreen */}
      <div className={`h-full w-full flex items-center justify-center transition-all duration-300 ${showComments ? 'h-1/2' : 'h-full'}`}>
        {/* Video Post */}
        {hasVideo && (
          <video
            key={currentPost.id}
            src={currentPost.videos![0]}
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
              src={currentPost.images![0]}
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
                {currentPost.description}
              </p>
            </div>
          </div>
        )}

        {/* Bottom-Left Overlay - User Info & Description */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
          <div className="pointer-events-auto max-w-xl">
            {/* User Info */}
            <Link href={`/user/${currentPost.user.id}`} className="flex items-center gap-2 mb-2">
              {currentPost.user.avatar ? (
                <Image 
                  src={currentPost.user.avatar} 
                  alt={currentPost.user.username} 
                  width={36} 
                  height={36} 
                  className="w-9 h-9 rounded-full border-2 border-white" 
                  unoptimized 
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center border-2 border-white">
                  <span className="text-white text-sm font-bold">{currentPost.user.firstName[0]}</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-semibold text-sm">
                    {currentPost.user.firstName} {currentPost.user.lastName}
                  </span>
                  {(currentPost.user.verificationBadge?.status === 'verified' || currentPost.user.verificationBadge?.status === 'active') && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-300 text-xs">@{currentPost.user.username}</span>
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
          {currentPost.isLiked ? (
            <IoHeart className="w-7 h-7 text-red-500" />
          ) : (
            <IoHeartOutline className="w-7 h-7 text-white" />
          )}
          <span className="text-white text-xs font-semibold">{currentPost._count.likes}</span>
        </button>

        {/* Comment */}
        <button
          onClick={toggleComments}
          className="flex flex-col items-center gap-1 p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
        >
          <IoChatbubbleOutline className="w-7 h-7 text-white" />
          <span className="text-white text-xs font-semibold">{currentPost._count.comments}</span>
        </button>

        {/* Share */}
        <button
          onClick={() => {
            navigator.share?.({ 
              title: `Post by ${currentPost.user.firstName}`, 
              url: `${window.location.origin}/post/${currentPost.id}`
            }).catch(() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${currentPost.id}`);
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
          {currentPost.isBookmarked ? (
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
            Comments ({currentPost._count.comments})
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
