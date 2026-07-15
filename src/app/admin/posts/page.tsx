"use client";

import { useState, useEffect } from 'react';
import { IoTrashOutline, IoEye, IoRefresh, IoCloseCircle, IoWarning, IoImageOutline, IoVideocamOutline, IoDocumentTextOutline } from 'react-icons/io5';
import Image from 'next/image';

interface Post {
  id: string;
  description: string;
  images?: string[];
  videos?: string[];
  type: string;
  createdAt: string;
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
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = posts.filter(post => 
      post.user.username.toLowerCase().includes(query) ||
      post.user.firstName.toLowerCase().includes(query) ||
      post.user.lastName.toLowerCase().includes(query) ||
      post.description?.toLowerCase().includes(query)
    );
    setFilteredPosts(filtered);
  }, [searchQuery, posts]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        alert('Please login as admin first');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/admin/all`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch posts:', response.status, errorText);
        alert(`Failed to fetch posts: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      if (!data.success) {
        alert(`Error: ${data.message}`);
        return;
      }

      const postsData = data.data || [];
      setPosts(postsData);
      setFilteredPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('🗑️ Delete this post?\n\nThis action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/admin/${postId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ Post deleted successfully');
        fetchPosts();
        setSelectedPost(null);
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  const getPostMediaType = (post: Post) => {
    if (post.videos && post.videos.length > 0) return 'video';
    if (post.images && post.images.length > 0) return 'image';
    return 'text';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Post Management</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Review and moderate all social feed posts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-800">
          <p className="text-gray-400 text-xs sm:text-sm mb-1">Total Posts</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{posts.length}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-800">
          <p className="text-gray-400 text-xs sm:text-sm mb-1">Total Likes</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{posts.reduce((sum, p) => sum + p._count.likes, 0)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-800">
          <p className="text-gray-400 text-xs sm:text-sm mb-1">Total Comments</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{posts.reduce((sum, p) => sum + p._count.comments, 0)}</p>
        </div>
      </div>

      {/* Search Bar & Actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or content..."
            className="w-full px-4 py-3 pl-10 bg-slate-900/50 border border-slate-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <IoCloseCircle className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          onClick={fetchPosts}
          className="px-3 sm:px-4 py-2 bg-slate-900/50 hover:bg-slate-800 text-gray-300 border border-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <IoRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading posts...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-slate-900/50 rounded-lg p-8 sm:p-12 text-center border border-slate-800">
          <IoDocumentTextOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {searchQuery ? `No results found for "${searchQuery}"` : 'No posts yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredPosts.map((post) => {
            const mediaType = getPostMediaType(post);
            return (
              <div key={post.id} className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-800 hover:border-blue-500/30 transition-all">
                <div className="flex gap-3">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {post.user.avatar ? (
                      <img src={post.user.avatar} alt={post.user.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{post.user.firstName[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-white font-semibold text-sm">
                          {post.user.firstName} {post.user.lastName}
                        </h3>
                        <p className="text-gray-400 text-xs">@{post.user.username}</p>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Post Description */}
                    {post.description && (
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">{post.description}</p>
                    )}

                    {/* Media Indicator */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        {mediaType === 'video' && <IoVideocamOutline className="w-4 h-4 text-purple-400" />}
                        {mediaType === 'image' && <IoImageOutline className="w-4 h-4 text-blue-400" />}
                        {mediaType === 'text' && <IoDocumentTextOutline className="w-4 h-4 text-gray-400" />}
                        {mediaType === 'video' ? `${post.videos?.length} video(s)` : 
                         mediaType === 'image' ? `${post.images?.length} image(s)` : 'Text post'}
                      </span>
                      <span>❤️ {post._count.likes}</span>
                      <span>💬 {post._count.comments}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <IoEye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <IoTrashOutline className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white">Post Details</h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <IoCloseCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-4 space-y-4 overflow-y-auto flex-1">
              {/* User Info */}
              <div className="flex items-center gap-3">
                {selectedPost.user.avatar ? (
                  <img src={selectedPost.user.avatar} alt={selectedPost.user.username} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold">{selectedPost.user.firstName[0]}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-white font-semibold">{selectedPost.user.firstName} {selectedPost.user.lastName}</h3>
                  <p className="text-gray-400 text-sm">@{selectedPost.user.username}</p>
                </div>
              </div>

              {/* Post Content */}
              {selectedPost.description && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-white text-sm whitespace-pre-wrap">{selectedPost.description}</p>
                </div>
              )}

              {/* Images */}
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <h3 className="text-white font-semibold mb-2 text-sm">Images</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPost.images.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border border-slate-600 hover:border-blue-500 transition-colors"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {selectedPost.videos && selectedPost.videos.length > 0 && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <h3 className="text-white font-semibold mb-2 text-sm">Videos</h3>
                  <div className="space-y-2">
                    {selectedPost.videos.map((url, index) => (
                      <video key={index} controls className="w-full rounded-lg border border-slate-600">
                        <source src={url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{selectedPost._count.likes}</p>
                    <p className="text-xs text-gray-400">Likes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{selectedPost._count.comments}</p>
                    <p className="text-xs text-gray-400">Comments</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{new Date(selectedPost.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">Posted</p>
                  </div>
                </div>
              </div>

              {/* Delete Warning */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <IoWarning className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 text-sm font-semibold mb-1">Danger Zone</p>
                    <p className="text-red-300/80 text-xs mb-3">Deleting this post will permanently remove it and all associated likes and comments.</p>
                    <button
                      onClick={() => handleDelete(selectedPost.id)}
                      disabled={deleting}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <IoTrashOutline className="w-4 h-4" />
                      {deleting ? 'Deleting...' : 'Delete Post Permanently'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800">
              <button
                onClick={() => setSelectedPost(null)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
