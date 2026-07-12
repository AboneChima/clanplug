'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IoArrowBackOutline, IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareSocialOutline, IoBookmarkOutline, IoBookmark, IoChevronDownOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
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

  if (loading) {
    return (
      <AppShell>
        <div className="h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="h-screen bg-black flex items-center justify-center">
          <p className="text-gray-500">Post not found</p>
        </div>
      </AppShell>
    );
  }

  const hasVideo = post.videos && post.videos[0];
  const hasImage = post.images && post.images[0];
  const isTextOnly = !hasVideo && !hasImage;

  return (
    <AppShell>
      <div className="h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Back Button - Top Left */}
        <Link href="/feed" className="absolute top-4 left-4 z-50">
          <button className="p-2.5 bg-black/60 backdrop-blur-md rounded-full hover:bg-black/80 transition-all">
            <IoArrowBackOutline className="w-6 h-6 text-white" />
          </button>
        </Link>

        {/* Main Content Area */}
        <div className={`relative w-full h-full flex items-center justify-center ${showComments ? 'pb-[50vh]' : ''} transition-all duration-300`}>
          
          {/* VIDEO POST */}
          {hasVideo && (
            <div className="relative w-full h-full bg-black">
              <video
                src={post.videos![0]}
                className="w-full h-full object-contain"
                controls
                playsInline
                autoPlay
                preload="metadata"
              />

              {/* Video Overlay - Bottom Left Info */}
              <div className="absolute bottom-20 left-4 right-20 z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-3 pointer-events-auto">
                  <Link href={`/user/${post.user.id}`} className="flex items-center gap-2">
                    {post.user.avatar ? (
                      <Image src={post.user.avatar} alt={post.user.username} width={32} height={32} className="w-8 h-8 rounded-full border-2 border-white/50" unoptimized />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/50">
                        <span className="text-white text-sm font-bold">{post.user.firstName[0]}</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold text-sm drop-shadow-lg">{post.user.firstName} {post.user.lastName}</span>
                        {(post.user.verificationBadge?.status === 'verified' || post.user.verificationBadge?.status === 'active') && (
                          <svg className="w-4 h-4 text-blue-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="pointer-events-auto">
                  <p className={`text-white text-sm drop-shadow-lg ${!descriptionExpanded && post.description.length > 100 ? 'line-clamp-2' : ''}`}>
                    {post.description}
                  </p>
                  {post.description.length > 100 && (
                    <button
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      className="text-white/80 text-xs mt-1 hover:text-white"
                    >
                      {descriptionExpanded ? 'Show less' : 'more...'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* IMAGE POST */}
          {hasImage && !hasVideo && (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <Image src={post.images![0]} alt="Post" fill className="object-contain" unoptimized />

              <div className="absolute bottom-20 left-4 right-20 z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Link href={`/user/${post.user.id}`} className="flex items-center gap-2">
                    {post.user.avatar ? (
                      <Image src={post.user.avatar} alt={post.user.username} width={32} height={32} className="w-8 h-8 rounded-full border-2 border-white/50" unoptimized />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/50">
                        <span className="text-white text-sm font-bold">{post.user.firstName[0]}</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold text-sm drop-shadow-lg">{post.user.firstName} {post.user.lastName}</span>
                        {(post.user.verificationBadge?.status === 'verified' || post.user.verificationBadge?.status === 'active') && (
                          <svg className="w-4 h-4 text-blue-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>

                <div>
                  <p className={`text-white text-sm drop-shadow-lg ${!descriptionExpanded && post.description.length > 100 ? 'line-clamp-2' : ''}`}>
                    {post.description}
                  </p>
                  {post.description.length > 100 && (
                    <button
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      className="text-white/80 text-xs mt-1 hover:text-white"
                    >
                      {descriptionExpanded ? 'Show less' : 'more...'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TEXT ONLY POST - Story Style */}
          {isTextOnly && (
            <div className="relative w-full h-full flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
              <div className="max-w-lg px-8 text-center">
                <Link href={`/user/${post.user.id}`} className="flex items-center justify-center gap-2 mb-8">
                  {post.user.avatar ? (
                    <Image src={post.user.avatar} alt={post.user.username} width={40} height={40} className="w-10 h-10 rounded-full border-2 border-white/50" unoptimized />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/50">
                      <span className="text-white font-bold">{post.user.firstName[0]}</span>
                    </div>
                  )}
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-semibold drop-shadow-lg">{post.user.firstName} {post.user.lastName}</span>
                      {(post.user.verificationBadge?.status === 'verified' || post.user.verificationBadge?.status === 'active') && (
                        <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </Link>

                <p className="text-white text-2xl font-medium leading-relaxed drop-shadow-2xl whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Right Side Column */}
        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            {post.isLiked ? (
              <div className="p-3 bg-black/40 backdrop-blur-md rounded-full">
                <IoHeart className="w-7 h-7 text-red-500" />
              </div>
            ) : (
              <div className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all">
                <IoHeartOutline className="w-7 h-7 text-white" />
              </div>
            )}
            <span className="text-white text-xs font-semibold drop-shadow-lg">{post._count.likes}</span>
          </button>

          <button onClick={toggleComments} className="flex flex-col items-center gap-1">
            <div className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all">
              <IoChatbubbleOutline className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow-lg">{post._count.comments}</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all">
              <IoShareSocialOutline className="w-7 h-7 text-white" />
            </div>
          </button>

          <button onClick={handleBookmark} className="flex flex-col items-center gap-1">
            {post.isBookmarked ? (
              <div className="p-3 bg-black/40 backdrop-blur-md rounded-full">
                <IoBookmark className="w-7 h-7 text-blue-500" />
              </div>
            ) : (
              <div className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all">
                <IoBookmarkOutline className="w-7 h-7 text-white" />
              </div>
            )}
          </button>
        </div>

        {/* Comments Section - Slides Up from Bottom */}
        <div className={`absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 transition-all duration-300 ${showComments ? 'h-[50vh]' : 'h-0'} overflow-hidden z-30`}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <IoChatbubbleOutline className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">{post._count.comments} Comments</span>
              </div>
              <button onClick={toggleComments} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <IoChevronDownOutline className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <IoChatbubbleOutline className="w-12 h-12 text-gray-600 mb-2" />
                  <p className="text-gray-400 text-sm">No comments yet</p>
                  <p className="text-gray-600 text-xs">Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Link href={`/user/${comment.user.id}`}>
                        {comment.user.avatar ? (
                          <Image src={comment.user.avatar} alt={comment.user.username} width={32} height={32} className="w-8 h-8 rounded-full" unoptimized />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
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
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="text-gray-500 text-xs">· {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <p className="text-white text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-black">
              <div className="flex gap-2">
                {user?.avatar ? (
                  <Image src={user.avatar} alt={user.username} width={32} height={32} className="w-8 h-8 rounded-full" unoptimized />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
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
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white/30"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || submitting}
                    className="px-4 py-2 bg-white hover:bg-white/90 disabled:opacity-30 disabled:hover:bg-white text-black text-sm font-semibold rounded-full transition-all"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
