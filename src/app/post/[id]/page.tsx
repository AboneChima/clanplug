'use client';

import { useState, useEffect, useRef } from 'react';
import { IoHeartOutline, IoHeart, IoChatbubbleOutline, IoBookmarkOutline, IoBookmark, IoSendOutline, IoChevronDown, IoArrowBackOutline } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useParams, useRouter } from 'next/navigation';
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
  const { user } = useAuth();
  const { showToast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Hide/show bottom menu when modals are open
  useEffect(() => {
    const bottomMenu = document.querySelector('nav.lg\\:hidden.fixed') as HTMLElement;
    if (bottomMenu) {
      if (showComments || showMoreMenu) {
        bottomMenu.style.display = 'none';
      } else {
        bottomMenu.style.display = 'block';
      }
    }
  }, [showComments, showMoreMenu]);

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
    
    // iOS viewport height fix
    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    
    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
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
    if (!post) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}/comments`, {
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
        setPost({ ...post, _count: { ...post._count, comments: post._count.comments + 1 } });
      }
    } catch (error) {
      showToast('Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComments = () => {
    if (showComments) {
      setShowComments(false);
    } else {
      setShowComments(true);
      if (!comments.length) {
        fetchComments();
      }
    }
  };

  // Video control handlers
  const toggleVideoPlay = () => {
    const video = videoRef.current;
    if (!video) return;

    const isPlaying = !video.paused;
    
    if (isPlaying) {
      video.pause();
      setVideoPlaying(false);
      setShowPlayIcon(true);
    } else {
      video.play();
      setVideoPlaying(true);
      setShowPlayIcon(false);
    }
  };

  const handleVideoProgress = () => {
    const video = videoRef.current;
    if (!video) return;

    const progress = (video.currentTime / video.duration) * 100;
    setVideoProgress(progress);
  };

  const handleVideoSeek = (seekPercentage: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = (seekPercentage / 100) * video.duration;
    setVideoProgress(seekPercentage);
  };

  const handleProgressBarInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const progressBar = progressBarRef.current;
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    handleVideoSeek(percentage);
  };

  const handleProgressBarDragStart = () => {
    setIsDragging(true);
  };

  const handleProgressBarDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging && !('touches' in e)) return;
    handleProgressBarInteraction(e);
  };

  const handleProgressBarDragEnd = () => {
    setIsDragging(false);
  };

  const handleDownloadVideo = async (videoUrl: string, postId: string) => {
    try {
      showToast('Preparing download...', 'info');
      setShowMoreMenu(false);
      
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `clanplug-video-${postId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(blobUrl);
      
      showToast('Video downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Download failed. Please try again.', 'error');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post?.id}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied!', 'success');
    setShowMoreMenu(false);
  };

  const handleShare = async () => {
    if (!post) return;
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ 
          title: `Post by ${post.user.firstName}`, 
          url 
        });
        setShowMoreMenu(false);
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

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

  const hasVideo = post.videos && post.videos.length > 0;
  const hasImage = post.images && post.images.length > 0;
  const isTextOnly = !hasVideo && !hasImage;
  const needsTruncation = post.description && post.description.length > 100;
  const displayDescription = needsTruncation && !descriptionExpanded
    ? post.description.substring(0, 100) + '...' 
    : post.description;

  return (
    <div className="relative bg-black min-h-screen">
      {/* Back Button - Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => router.back()}
          className="p-3 bg-black/60 backdrop-blur-md rounded-full hover:bg-black/80 transition-all shadow-lg"
        >
          <IoArrowBackOutline className="w-6 h-6 text-white drop-shadow-lg" />
        </button>
      </div>

      {/* Fullscreen Post Container */}
      <div 
        className="feed-post-item relative flex items-center justify-center bg-black"
        style={{ 
          height: '100vh',
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Fullscreen Media Content */}
        <div className={`absolute inset-0 bg-black flex items-center justify-center transition-all duration-300 ${
          showComments ? 'scale-85 -translate-y-[20%]' : (isTextOnly || hasVideo || hasImage) ? '-translate-y-[10%]' : ''
        }`}>
          {/* Video Post - Custom Controls */}
          {hasVideo && (
            <div className="relative w-full h-full" onClick={toggleVideoPlay}>
              <video
                ref={videoRef}
                src={post.videos![0]}
                className="w-full h-full object-contain bg-black cursor-pointer"
                playsInline
                loop
                muted={false}
                preload="metadata"
                onTimeUpdate={handleVideoProgress}
                onLoadedMetadata={() => {
                  setShowPlayIcon(true);
                }}
                onPlay={() => {
                  setVideoPlaying(true);
                  setShowPlayIcon(false);
                }}
                onPause={() => {
                  setVideoPlaying(false);
                  setShowPlayIcon(true);
                }}
              />
              
              {/* Play Icon Overlay - Only show when paused */}
              {showPlayIcon && !videoPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-24 h-24 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-14 h-14 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Custom Progress Bar */}
              <div 
                className="absolute left-0 right-0 px-4 z-50 pointer-events-auto" 
                style={{ bottom: '70px' }}
              >
                <div 
                  ref={progressBarRef}
                  className="relative h-1 bg-gray-700/80 rounded-full cursor-pointer touch-none"
                  onClick={handleProgressBarInteraction}
                  onMouseDown={handleProgressBarDragStart}
                  onMouseMove={handleProgressBarDragMove}
                  onMouseUp={handleProgressBarDragEnd}
                  onMouseLeave={handleProgressBarDragEnd}
                  onTouchStart={(e) => {
                    handleProgressBarDragStart();
                    handleProgressBarInteraction(e);
                  }}
                  onTouchMove={handleProgressBarInteraction}
                  onTouchEnd={handleProgressBarDragEnd}
                >
                  <div 
                    className="absolute left-0 top-0 h-full bg-white rounded-full transition-all pointer-events-none"
                    style={{ width: `${videoProgress || 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                  </div>
                </div>
              </div>
            </div>
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

          {/* Text-only Post - Solid dark blue with elegant styling */}
          {isTextOnly && (
            <div className="w-full h-full flex items-center justify-center bg-[#0f1729] p-8">
              <div className="max-w-2xl text-center">
                <p className="text-white text-xl md:text-2xl font-light italic leading-relaxed tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  {post.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Overlay - User Info & Description */}
        <div 
          className="absolute left-0 right-0 px-4 pb-2 pointer-events-none z-10" 
          style={{ bottom: '180px' }}
        >
          <div className="pointer-events-auto max-w-xl">
            {/* Description - Only show for media posts */}
            {!isTextOnly && post.description && (
              <div className="text-white text-sm mb-3 bg-gradient-to-r from-black/60 to-transparent pr-20 py-1 rounded">
                <p className="mb-1 drop-shadow-lg">{displayDescription}</p>
                {needsTruncation && (
                  <button
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors drop-shadow-lg"
                  >
                    {descriptionExpanded ? 'Show less' : 'more...'}
                  </button>
                )}
              </div>
            )}

            {/* User Info */}
            <Link href={`/user/${post.user.id}`} className="flex items-center gap-2">
              {post.user.avatar ? (
                <Image 
                  src={post.user.avatar} 
                  alt={post.user.username} 
                  width={32} 
                  height={32} 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg" 
                  unoptimized 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white text-xs font-bold">{post.user.firstName[0]}</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-semibold text-sm drop-shadow-lg">
                    {post.user.firstName} {post.user.lastName}
                  </span>
                  {(post.user.verificationBadge?.status === 'verified' || post.user.verificationBadge?.status === 'active') && (
                    <svg className="w-4 h-4 text-blue-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-300 text-xs drop-shadow-lg">@{post.user.username}</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div 
          className="absolute right-3 flex flex-col gap-6 z-10" 
          style={{ bottom: '270px' }}
        >
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1 transition-transform hover:scale-110 active:scale-95"
          >
            {post.isLiked ? (
              <IoHeart className="w-8 h-8 text-red-500 drop-shadow-lg" />
            ) : (
              <IoHeartOutline className="w-8 h-8 text-white drop-shadow-lg" />
            )}
            <span className="text-white text-xs font-bold drop-shadow-lg">{post._count.likes}</span>
          </button>

          {/* Comment */}
          <button
            onClick={toggleComments}
            className="flex flex-col items-center gap-1 transition-transform hover:scale-110 active:scale-95"
          >
            <IoChatbubbleOutline className="w-8 h-8 text-white drop-shadow-lg" />
            <span className="text-white text-xs font-bold drop-shadow-lg">{post._count.comments}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            {post.isBookmarked ? (
              <IoBookmark className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
            ) : (
              <IoBookmarkOutline className="w-8 h-8 text-white drop-shadow-lg" />
            )}
          </button>

          {/* More Menu Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
        </div>

        {/* More Menu - Half page */}
        {showMoreMenu && (
          <div className="fixed inset-0 z-[150] flex flex-col justify-end bg-black/50" onClick={() => setShowMoreMenu(false)}>
            <div className="w-full h-[50vh] bg-black border-t border-gray-800 animate-slide-up flex flex-col z-[200]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 bg-black">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold text-base">Options</h3>
                  <button
                    onClick={() => setShowMoreMenu(false)}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <IoChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-900 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white text-xs font-medium">Copy Link</span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-900 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-white text-xs font-medium">Share</span>
                  </button>

                  {/* Download - Only for videos */}
                  {hasVideo && (
                    <button
                      onClick={() => handleDownloadVideo(post.videos![0], post.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-900 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="text-white text-xs font-medium">Download</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments Modal - Larger (70vh) */}
        {showComments && (
          <div className="fixed inset-0 z-[200] flex flex-col justify-end bg-black/50" onClick={() => setShowComments(false)}>
            <div 
              className="w-full h-[70vh] bg-black border-t border-gray-800 pb-20 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Comments Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
                <h2 className="text-white font-semibold text-lg">
                  Comments ({post._count.comments})
                </h2>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-2 hover:bg-gray-900 rounded-full transition-colors"
                >
                  <IoChevronDown className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Comment Input */}
              <div className="p-3 border-b border-gray-800 bg-gray-950 flex-shrink-0">
                <div className="flex gap-2">
                  {user?.avatar ? (
                    <Image 
                      src={user.avatar} 
                      alt={user.username || 'User'} 
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
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 160px)' }}>
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
        )}
      </div>
    </div>
  );
}
