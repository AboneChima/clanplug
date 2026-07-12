'use client';

import { useState, useEffect, useRef } from 'react';
import { IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareSocialOutline, IoBookmarkOutline, IoBookmark, IoSendOutline, IoCloseOutline, IoChevronDown } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
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
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

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
        setCurrentIndex(newIndex);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
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
          <p className="text-gray-500 text-lg mb-4">No posts yet</p>
          <Link href="/create-post">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors">
              Create your first post
            </button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="relative bg-black">
        {/* Fixed Header - For You, Bookmarks, Search, Create Post */}
        <div className="fixed top-14 lg:top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
          <div className="max-w-2xl mx-auto flex items-center gap-2 px-4 py-3">
            <button className="px-3 py-1.5 text-sm font-semibold rounded-full bg-blue-600 text-white">
              For You
            </button>
            <Link href="/bookmarks">
              <button className="px-3 py-1.5 text-sm font-semibold rounded-full bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-all">
                Bookmarks
              </button>
            </Link>
            
            <div className="flex-1"></div>
            
            <Link href="/search">
              <button className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-full transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </Link>
            
            <Link href="/create-post">
              <button className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </Link>
          </div>
        </div>

        {/* Fullscreen Snap Scroll Container */}
        <div 
          ref={scrollContainerRef}
          className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
          style={{ 
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'smooth',
            paddingTop: 'calc(3.5rem + 56px)', // Account for AppShell header + our header
            paddingBottom: '4rem' // Account for bottom nav
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
                className="relative h-screen w-full snap-start snap-always flex items-center justify-center"
              >
                {/* Fullscreen Media Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Video Post */}
                  {hasVideo && (
                    <video
                      src={post.videos![0]}
                      className="w-full h-full object-contain bg-black"
                      controls
                      playsInline
                      autoPlay={index === currentIndex}
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
                </div>

                {/* Bottom-Left Overlay - User Info & Description */}
                <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none z-10">
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
                            onClick={() => setDescriptionExpanded(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            className="text-blue-400 text-xs font-medium hover:text-blue-300 transition-colors"
                          >
                            {descriptionExpanded[post.id] ? 'Show less' : 'more...'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Action Buttons */}
                <div className="absolute right-3 bottom-32 flex flex-col gap-4 z-10">
                  {/* Like */}
                  <button
                    onClick={() => handleLike(post.id)}
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
                    onClick={() => toggleComments(post.id)}
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
                        url: `${window.location.origin}/post/${post.id}`
                      }).catch(() => {
                        navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                        showToast('Link copied!', 'success');
                      });
                    }}
                    className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all"
                  >
                    <IoShareSocialOutline className="w-7 h-7 text-white" />
                  </button>

                  {/* Bookmark */}
                  <button
                    onClick={() => handleBookmark(post.id)}
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
                {showComments === post.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-black border-t border-gray-800 z-20 animate-slide-up">
                    {/* Comments Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
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

                    {/* Comments List - Scrollable */}
                    <div className="overflow-y-auto h-[calc(100%-140px)]">
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
