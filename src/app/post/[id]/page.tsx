'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IoArrowBackOutline, IoHeartOutline, IoHeart, IoChatbubbleOutline, IoShareSocialOutline, IoBookmarkOutline, IoBookmark, IoSendOutline } from 'react-icons/io5';
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

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <p className="text-gray-500">Post not found</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-black pb-20">
        <div className="max-w-2xl mx-auto border-x border-[#2f3336]">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-[#2f3336] px-3 py-2 flex items-center gap-3">
            <Link href="/feed">
              <button className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
                <IoArrowBackOutline className="w-5 h-5 text-white" />
              </button>
            </Link>
            <h1 className="text-base font-bold text-white">Post</h1>
          </div>

          {/* Post */}
          <div className="p-3 border-b border-[#2f3336]">
            <div className="flex gap-2 mb-3">
              <Link href={`/user/${post.user.id}`}>
                {post.user.avatar ? (
                  <Image src={post.user.avatar} alt={post.user.username} width={40} height={40} className="w-10 h-10 rounded-full" unoptimized />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{post.user.firstName[0]}</span>
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <Link href={`/user/${post.user.id}`} className="font-bold text-white text-sm hover:underline">
                    {post.user.firstName} {post.user.lastName}
                  </Link>
                  {(post.user.verificationBadge?.status === 'verified' || post.user.verificationBadge?.status === 'active') && (
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-gray-500 text-xs">@{post.user.username}</p>
              </div>
            </div>

            <p className="text-white text-sm mb-3 whitespace-pre-wrap">{post.description}</p>

            {post.images && post.images[0] && (
              <div className="mb-3 rounded-xl overflow-hidden border border-[#2f3336] relative group">
                <Image src={post.images[0]} alt="Post" width={600} height={400} className="w-full" unoptimized />
                {/* Download button with watermark */}
                <button
                  onClick={async () => {
                    try {
                      const { addWatermarkToImage, downloadFile } = await import('@/utils/watermark');
                      showToast('Adding watermark...', 'info');
                      const blob = await addWatermarkToImage(post.images![0]);
                      downloadFile(blob, `clanplug-${post.id}.png`);
                      showToast('Downloaded with watermark!', 'success');
                    } catch (error) {
                      console.error('Download error:', error);
                      showToast('Download failed', 'error');
                    }
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            )}

            {post.videos && post.videos[0] && (
              <div className="mb-3 rounded-xl overflow-hidden border border-[#2f3336] relative group">
                <div className="relative">
                  <video
                    src={post.videos[0]}
                    className="w-full"
                    controls
                    playsInline
                    preload="metadata"
                    autoPlay
                  />
                  {/* Watermark overlay for video - centered bottom */}
                  <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 pointer-events-none">
                    <p className="text-white/80 text-sm font-semibold tracking-wider drop-shadow-lg">clanplug</p>
                  </div>
                </div>
                {/* Download button for video */}
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = post.videos![0];
                    a.download = `clanplug-video-${post.id}.mp4`;
                    a.click();
                    showToast('Downloading video with watermark...', 'success');
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            )}

            <p className="text-gray-500 text-xs mb-3">
              {new Date(post.createdAt).toLocaleString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 py-2 border-y border-[#2f3336] text-xs">
              <span className="text-white"><span className="font-bold">{post._count.likes}</span> <span className="text-gray-500">Likes</span></span>
              <span className="text-white"><span className="font-bold">{post._count.comments}</span> <span className="text-gray-500">Comments</span></span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-around py-2 border-b border-[#2f3336]">
              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors p-2">
                <IoChatbubbleOutline className="w-5 h-5" />
              </button>

              <button onClick={handleLike} className="flex items-center gap-2 text-gray-500 hover:text-pink-500 transition-colors p-2">
                {post.isLiked ? <IoHeart className="w-5 h-5 text-pink-500" /> : <IoHeartOutline className="w-5 h-5" />}
              </button>

              <button className="text-gray-500 hover:text-green-500 transition-colors p-2">
                <IoShareSocialOutline className="w-5 h-5" />
              </button>

              <button onClick={handleBookmark} className="text-gray-500 hover:text-blue-500 transition-colors p-2">
                {post.isBookmarked ? <IoBookmark className="w-5 h-5 text-blue-500" /> : <IoBookmarkOutline className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-3 border-b border-[#2f3336]">
            <div className="flex gap-2">
              {user?.avatar ? (
                <Image src={user.avatar} alt={user.username} width={32} height={32} className="w-8 h-8 rounded-full" unoptimized />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{user?.firstName?.[0] || 'U'}</span>
                </div>
              )}
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Post your reply"
                  className="flex-1 px-3 py-2 bg-transparent border-b border-[#2f3336] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || submitting}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded-full transition-colors"
                >
                  <IoSendOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            {comments.length === 0 ? (
              <div className="p-8 text-center">
                <IoChatbubbleOutline className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No comments yet</p>
                <p className="text-gray-600 text-xs">Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-3 border-b border-[#2f3336] hover:bg-[#080808] transition-colors">
                  <div className="flex gap-2">
                    <Link href={`/user/${comment.user.id}`}>
                      {comment.user.avatar ? (
                        <Image src={comment.user.avatar} alt={comment.user.username} width={32} height={32} className="w-8 h-8 rounded-full" unoptimized />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{comment.user.firstName[0]}</span>
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <Link href={`/user/${comment.user.id}`} className="font-bold text-white text-xs hover:underline">
                          {comment.user.firstName} {comment.user.lastName}
                        </Link>
                        {(comment.user.verificationBadge?.status === 'verified' || comment.user.verificationBadge?.status === 'active') && (
                          <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="text-gray-500 text-[10px]">@{comment.user.username}</span>
                        <span className="text-gray-600 text-[10px]">·</span>
                        <span className="text-gray-600 text-[10px]">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-white text-xs whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
