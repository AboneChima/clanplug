'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareSocialOutline, IoBookmarkOutline, IoBookmark, IoSendOutline, IoChevronDown } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSearchParams } from 'next/navigation';
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

function FeedContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'foryou';
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState<Record<string, boolean>>({});
  const [videoPlaying, setVideoPlaying] = useState<Record<string, boolean>>({});
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});
  const [showPlayIcon, setShowPlayIcon] = useState<Record<string, boolean>>({});
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const progressBarRef = useRef<Record<string, HTMLDivElement>>({});

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
    fetchPosts();
    
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
  }, [activeTab]); // Refetch when tab changes

  // Snap scrolling handler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const windowHeight = window.innerHeight;
        const newIndex = Math.round(scrollTop / windowHeight);
        
        // Pause previous video when scrolling away
        if (newIndex !== currentIndex) {
          const prevPost = posts[currentIndex];
          if (prevPost?.videos && videoRefs.current[prevPost.id]) {
            videoRefs.current[prevPost.id].pause();
            setVideoPlaying(prev => ({ ...prev, [prevPost.id]: false }));
            setShowPlayIcon(prev => ({ ...prev, [prevPost.id]: true }));
          }
        }
        
        setCurrentIndex(newIndex);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex, posts]);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch bookmarks or feed based on active tab
      const endpoint = activeTab === 'bookmarks' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/posts/bookmarks`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/posts/feed`;
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Handle different response formats
        let postsData: Post[] = [];
        if (activeTab === 'bookmarks') {
          // Bookmarks returns { success, posts, pagination }
          postsData = Array.isArray(result.posts) ? result.posts : [];
        } else {
          // Feed returns { success, data, ... }
          postsData = Array.isArray(result.data) ? result.data : [];
        }
        
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
        setComments(prev => ({ ...prev, [postId]: data.data || [] }));
      }
    } catch (error) {
      console.error('Error:', error);
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
      const post = posts.find(p => p.id === postId);
      showToast(post?.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks', 'success');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText })
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({
          ...prev,
          [postId]: [data.data, ...(prev[postId] || [])]
        }));
        setCommentText('');
        setPosts(posts.map(post => 
          post.id === postId ? { ...post, _count: { ...post._count, comments: post._count.comments + 1 }} : post
        ));
      }
    } catch (error) {
      showToast('Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComments = (postId: string) => {
    if (showComments === postId) {
      setShowComments(null);
    } else {
      setShowComments(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
  };

  // Video control handlers
  const toggleVideoPlay = (postId: string) => {
    const video = videoRefs.current[postId];
    if (!video) return;

    const isPlaying = !video.paused;
    
    if (isPlaying) {
      video.pause();
      setVideoPlaying(prev => ({ ...prev, [postId]: false }));
      // Show play icon when paused (TikTok style - only show play, not pause)
      setShowPlayIcon(prev => ({ ...prev, [postId]: true }));
    } else {
      video.play();
      setVideoPlaying(prev => ({ ...prev, [postId]: true }));
      // Hide icon when playing
      setShowPlayIcon(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleVideoProgress = (postId: string) => {
    const video = videoRefs.current[postId];
    if (!video) return;

    const progress = (video.currentTime / video.duration) * 100;
    setVideoProgress(prev => ({ ...prev, [postId]: progress }));
  };

  const handleVideoSeek = (postId: string, seekPercentage: number) => {
    const video = videoRefs.current[postId];
    if (!video) return;

    video.currentTime = (seekPercentage / 100) * video.duration;
    setVideoProgress(prev => ({ ...prev, [postId]: seekPercentage }));
  };

  const handleProgressBarInteraction = (e: React.MouseEvent | React.TouchEvent, postId: string) => {
    e.stopPropagation();
    const progressBar = progressBarRef.current[postId];
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    handleVideoSeek(postId, percentage);
  };

  const handleProgressBarDragStart = (postId: string) => {
    setIsDragging(true);
  };

  const handleProgressBarDragMove = (e: React.MouseEvent | React.TouchEvent, postId: string) => {
    if (!isDragging && !('touches' in e)) return;
    handleProgressBarInteraction(e, postId);
  };

  const handleProgressBarDragEnd = () => {
    setIsDragging(false);
  };

  const handleDownloadVideo = async (videoUrl: string, postId: string) => {
    try {
      showToast('Preparing download...', 'info');
      setShowMoreMenu(null);
      
      // Fetch the video as a blob
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `clanplug-video-${postId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      showToast('Video downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Download failed. Please try again.', 'error');
    }
  };

  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied!', 'success');
    setShowMoreMenu(null);
  };

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ 
          title: `Post by ${post.user.firstName}`, 
          url 
        });
        setShowMoreMenu(null);
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopyLink(post.id);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </AppShell>
    );
  }

  if (posts.length === 0) {
    return (
      <AppShell>
        <div className="h-screen bg-black flex flex-col items-center justify-center p-8">
          <p className="text-gray-500 text-lg mb-4">
            {activeTab === 'bookmarks' ? 'No bookmarked posts yet' : 'No posts yet'}
          </p>
          {activeTab !== 'bookmarks' && (
            <Link href="/create-post">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors">
                Create your first post
              </button>
            </Link>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="relative bg-black min-h-screen">
        {/* Fixed Header - Solid black with gradient */}
        <div className="fixed top-14 lg:top-0 left-0 right-0 z-50 bg-gradient-to-b from-black via-black/95 to-black/70">
          <div className="max-w-2xl mx-auto flex items-center gap-2 px-4 py-3">
            <Link href="/feed">
              <button className={`px-3 py-1.5 text-sm font-semibold rounded-full shadow-lg transition-all ${
                activeTab === 'foryou' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}>
                For You
              </button>
            </Link>
            <Link href="/feed?tab=bookmarks">
              <button className={`px-3 py-1.5 text-sm font-semibold rounded-full shadow-lg transition-all ${
                activeTab === 'bookmarks' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}>
                Bookmarks
              </button>
            </Link>
            
            <div className="flex-1"></div>
            
            <Link href="/search">
              <button className="p-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded-full transition-all shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </Link>
            
            <Link href="/create-post">
              <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </Link>
          </div>
        </div>

        {/* Fullscreen Snap Scroll Container - Full viewport */}
        <div 
          ref={scrollContainerRef}
          className="feed-scroll-container overflow-y-scroll snap-y snap-mandatory scroll-smooth relative bg-black"
          style={{ 
            height: '100vh',
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'smooth',
          }}
        >
          {posts.map((post, index) => {
            const hasVideo = post.videos && post.videos.length > 0;
            const hasImage = post.images && post.images.length > 0;
            const isTextOnly = !hasVideo && !hasImage;
            const needsTruncation = post.description && post.description.length > 100;
            const displayDescription = needsTruncation && !descriptionExpanded[post.id]
              ? post.description.substring(0, 100) + '...' 
              : post.description;

            return (
              <div 
                key={post.id}
                className="feed-post-item relative snap-start snap-always flex items-center justify-center bg-black"
                style={{ 
                  height: '100vh',
                  minHeight: '100vh',
                  width: '100%',
                  overflow: 'hidden'
                }}
              >
                {/* Fullscreen Media Content - Fill entire viewport, content positioned up */}
                <div className={`absolute inset-0 bg-black flex items-center justify-center transition-all duration-300 ${
                  showComments === post.id ? 'scale-85 -translate-y-[20%]' : (isTextOnly || hasVideo || hasImage) ? '-translate-y-[10%]' : ''
                }`}>
                  {/* Video Post - Custom Controls */}
                  {hasVideo && (
                    <div className="relative w-full h-full" onClick={() => toggleVideoPlay(post.id)}>
                      <video
                        ref={(el) => {
                          if (el) videoRefs.current[post.id] = el;
                        }}
                        src={post.videos![0]}
                        className="w-full h-full object-contain bg-black cursor-pointer"
                        playsInline
                        autoPlay={index === currentIndex}
                        loop
                        muted={false}
                        onTimeUpdate={() => handleVideoProgress(post.id)}
                        onLoadedMetadata={(e) => {
                          // Initially show play icon until video starts
                          setShowPlayIcon(prev => ({ ...prev, [post.id]: false }));
                        }}
                        onPlay={() => {
                          setVideoPlaying(prev => ({ ...prev, [post.id]: true }));
                          setShowPlayIcon(prev => ({ ...prev, [post.id]: false }));
                        }}
                        onPause={() => {
                          setVideoPlaying(prev => ({ ...prev, [post.id]: false }));
                          setShowPlayIcon(prev => ({ ...prev, [post.id]: true }));
                        }}
                      />
                      
                      {/* Play Icon Overlay - Only show when paused (TikTok style) */}
                      {showPlayIcon[post.id] && !videoPlaying[post.id] && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <div className="w-24 h-24 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <svg className="w-14 h-14 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Custom Progress Bar - Lower */}
                      <div 
                        className="absolute left-0 right-0 px-4 z-50 pointer-events-auto" 
                        style={{ bottom: '70px' }} // Lower position
                      >
                        <div 
                          ref={(el) => {
                            if (el) progressBarRef.current[post.id] = el;
                          }}
                          className="relative h-1 bg-gray-700/80 rounded-full cursor-pointer touch-none"
                          onClick={(e) => handleProgressBarInteraction(e, post.id)}
                          onMouseDown={() => handleProgressBarDragStart(post.id)}
                          onMouseMove={(e) => handleProgressBarDragMove(e, post.id)}
                          onMouseUp={handleProgressBarDragEnd}
                          onMouseLeave={handleProgressBarDragEnd}
                          onTouchStart={(e) => {
                            handleProgressBarDragStart(post.id);
                            handleProgressBarInteraction(e, post.id);
                          }}
                          onTouchMove={(e) => handleProgressBarInteraction(e, post.id)}
                          onTouchEnd={handleProgressBarDragEnd}
                        >
                          <div 
                            className="absolute left-0 top-0 h-full bg-white rounded-full transition-all pointer-events-none"
                            style={{ width: `${videoProgress[post.id] || 0}%` }}
                          >
                            {/* Progress indicator dot */}
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

                {/* Bottom Overlay - User Info & Description - Much higher */}
                <div 
                  className="absolute left-0 right-0 px-4 pb-2 pointer-events-none z-10" 
                  style={{ bottom: '180px' }} // Much higher up
                >
                  <div className="pointer-events-auto max-w-xl">
                    {/* Description - Only show for media posts */}
                    {!isTextOnly && post.description && (
                      <div className="text-white text-sm mb-3 bg-gradient-to-r from-black/60 to-transparent pr-20 py-1 rounded">
                        <p className="mb-1 drop-shadow-lg">{displayDescription}</p>
                        {needsTruncation && (
                          <button
                            onClick={() => setDescriptionExpanded(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors drop-shadow-lg"
                          >
                            {descriptionExpanded[post.id] ? 'Show less' : 'more...'}
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

                {/* Right Side - Action Buttons - Higher */}
                <div 
                  className="absolute right-3 flex flex-col gap-6 z-10" 
                  style={{ bottom: '270px' }} // Higher to match name
                >
                  {/* Like */}
                  <button
                    onClick={() => handleLike(post.id)}
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
                    onClick={() => toggleComments(post.id)}
                    className="flex flex-col items-center gap-1 transition-transform hover:scale-110 active:scale-95"
                  >
                    <IoChatbubbleOutline className="w-8 h-8 text-white drop-shadow-lg" />
                    <span className="text-white text-xs font-bold drop-shadow-lg">{post._count.comments}</span>
                  </button>

                  {/* Bookmark */}
                  <button
                    onClick={() => handleBookmark(post.id)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    {post.isBookmarked ? (
                      <IoBookmark className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
                    ) : (
                      <IoBookmarkOutline className="w-8 h-8 text-white drop-shadow-lg" />
                    )}
                  </button>

                  {/* More Menu Button (horizontal 3 dots) */}
                  <button
                    onClick={() => setShowMoreMenu(showMoreMenu === post.id ? null : post.id)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="5" cy="12" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="19" cy="12" r="2"/>
                    </svg>
                  </button>
                </div>

                {/* More Menu - Half page, smaller icons */}
                {showMoreMenu === post.id && (
                  <div className="fixed inset-0 z-[150] flex flex-col justify-end bg-black/50" onClick={() => setShowMoreMenu(null)}>
                    <div className="w-full h-[50vh] bg-black border-t border-gray-800 animate-slide-up flex flex-col z-[200]" onClick={(e) => e.stopPropagation()}>
                      <div className="p-6 bg-black">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-white font-semibold text-base">Options</h3>
                          <button
                            onClick={() => setShowMoreMenu(null)}
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                          >
                            <IoChevronDown className="w-5 h-5 text-gray-400" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(post.id)}
                            className="flex flex-col items-center gap-2 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
                          >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-white text-xs font-medium">Copy Link</span>
                          </button>

                          {/* Share */}
                          <button
                            onClick={() => handleShare(post)}
                            className="flex flex-col items-center gap-2 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
                          >
                            <IoShareSocialOutline className="w-6 h-6 text-white" />
                            <span className="text-white text-xs font-medium">Share</span>
                          </button>

                          {/* Download (only for videos) */}
                          {hasVideo && (
                            <button
                              onClick={() => handleDownloadVideo(post.videos![0], post.id)}
                              className="flex flex-col items-center gap-2 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
                            >
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                {/* Comments Slide-up Panel - Larger (70vh) */}
                {showComments === post.id && (
                  <>
                    {/* Dark overlay behind comments */}
                    <div 
                      className="fixed inset-0 bg-black/60 z-[150]" 
                      onClick={() => setShowComments(null)}
                    />
                    
                    {/* Comments panel - 70vh sliding from bottom */}
                    <div className="fixed left-0 right-0 bottom-0 h-[70vh] bg-black border-t border-gray-800 z-[200] animate-slide-up flex flex-col pb-20">
                      {/* Comments Header */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black flex-shrink-0">
                        <h2 className="text-white font-semibold text-lg">
                          Comments ({post._count.comments})
                        </h2>
                        <button
                          onClick={() => setShowComments(null)}
                          className="p-2 hover:bg-gray-900 rounded-full transition-colors"
                        >
                          <IoChevronDown className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      {/* Comment Input */}
                      <div className="p-3 border-b border-gray-800 bg-black flex-shrink-0">
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
                              onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                              placeholder="Add a comment..."
                              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => handleComment(post.id)}
                              disabled={!commentText.trim() || submitting}
                              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full transition-colors"
                            >
                              <IoSendOutline className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Comments List - Scrollable with large bottom padding */}
                      <div className="overflow-y-auto flex-1 bg-black pb-32">
                      {!comments[post.id] || comments[post.id].length === 0 ? (
                        <div className="p-8 text-center">
                          <IoChatbubbleOutline className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No comments yet</p>
                          <p className="text-gray-600 text-xs">Be the first to comment!</p>
                        </div>
                      ) : (
                        comments[post.id].map((comment) => (
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
                </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </AppShell>
    }>
      <FeedContent />
    </Suspense>
  );
}
