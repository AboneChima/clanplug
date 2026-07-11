'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoArrowBack, IoImageOutline, IoCloseOutline, IoVideocamOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Image from 'next/image';
import Link from 'next/link';

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVerified = (user as any)?.verificationBadge?.status === 'verified' || (user as any)?.verificationBadge?.status === 'active';

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVerified) {
      showToast('Purchase verification badge to post images', 'error');
      return;
    }

    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 4) {
      showToast('Maximum 4 images allowed', 'error');
      return;
    }

    setImages([...images, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVerified) {
      showToast('Purchase verification badge to post videos', 'error');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    // Check video duration
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    
    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);
      const duration = videoElement.duration;
      
      if (duration > 45) {
        showToast('Video must be 45 seconds or less', 'error');
        return;
      }

      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    };

    videoElement.src = URL.createObjectURL(file);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      showToast('Please write something', 'error');
      return;
    }

    // Media check - only verified badge users can post images/videos
    if ((images.length > 0 || video) && !isVerified) {
      showToast('Only verified badge users can post images/videos', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Upload media
      const mediaUrls: string[] = [];
      
      // Upload images
      if (images.length > 0) {
        for (const file of images) {
          try {
            const formData = new FormData();
            formData.append('media', file);
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error('Failed to upload image');
            }
            
            const data = await response.json();
            // Handle both data.data.url and data.data.urls[0] formats
            const url = data.data?.urls?.[0] || data.data?.url || data.url;
            if (url) {
              mediaUrls.push(url);
            }
          } catch (err) {
            console.error('Image upload error:', err);
            showToast('Failed to upload image', 'error');
          }
        }
      }

      // Upload video
      let videoUrl: string | null = null;
      if (video) {
        try {
          const formData = new FormData();
          formData.append('media', video);
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/upload-media`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Failed to upload video');
          }
          
          const data = await response.json();
          // Handle both data.data.url and data.data.urls[0] formats
          videoUrl = data.data?.urls?.[0] || data.data?.url || data.url || null;
        } catch (err) {
          console.error('Video upload error:', err);
          showToast('Failed to upload video', 'error');
        }
      }

      // Create post with correct field names
      // Use first 50 chars of description as title for social posts
      const title = description.slice(0, 50).trim() + (description.length > 50 ? '...' : '');
      
      const postData = {
        title,
        description,
        type: 'SOCIAL_POST',
        images: Array.isArray(mediaUrls) ? mediaUrls.filter(Boolean) : [],
        videos: videoUrl ? [videoUrl].filter(Boolean) : []
      };

      console.log('Creating post with data:', JSON.stringify(postData, null, 2));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        showToast('Post created!', 'success');
        router.push('/feed');
      } else {
        const errorData = await response.json();
        console.error('Post creation error:', errorData);
        showToast(errorData.message || 'Failed to create post', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error creating post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-black pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-[#262626]">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-white">
              <IoArrowBack className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-white">Create Post</h1>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !description.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-full transition-all"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            {user?.avatar ? (
              <Image src={user.avatar} alt={user.username} width={40} height={40} className="w-10 h-10 rounded-full object-cover" unoptimized />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold">{user?.firstName?.[0]}</span>
              </div>
            )}
            <div>
              <p className="text-white font-medium text-sm">{user?.firstName} {user?.lastName}</p>
              <p className="text-gray-400 text-xs">@{user?.username}</p>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's happening?"
            className="w-full bg-transparent text-white text-lg placeholder-gray-500 resize-none focus:outline-none mb-4"
            rows={6}
          />

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2f3336]">
                  <Image src={preview} alt={`Preview ${index + 1}`} fill className="object-cover" unoptimized />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black rounded-full transition-all"
                  >
                    <IoCloseOutline className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video Preview */}
          {videoPreview && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2f3336] mb-4">
              <video src={videoPreview} controls className="w-full h-full object-cover" />
              <button
                onClick={removeVideo}
                className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black rounded-full transition-all"
              >
                <IoCloseOutline className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Add Media Buttons */}
          <div className="flex gap-2 mb-4">
            {images.length < 4 && !video && (
              <label className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                isVerified 
                  ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a] border-[#2f3336] text-blue-400 cursor-pointer'
                  : 'bg-[#1a1a1a]/50 border-[#2f3336]/50 text-gray-600 cursor-not-allowed'
              }`}>
                <IoImageOutline className="w-5 h-5" />
                <span className="text-sm font-medium">Photos</span>
                {isVerified && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                )}
              </label>
            )}
            
            {!video && images.length === 0 && (
              <label className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                isVerified 
                  ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a] border-[#2f3336] text-blue-400 cursor-pointer'
                  : 'bg-[#1a1a1a]/50 border-[#2f3336]/50 text-gray-600 cursor-not-allowed'
              }`}>
                <IoVideocamOutline className="w-5 h-5" />
                <span className="text-sm font-medium">Video</span>
                {isVerified && (
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                )}
              </label>
            )}
          </div>

          {/* Verification Message for Media */}
          {!isVerified && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <IoShieldCheckmarkOutline className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-blue-400 text-sm font-medium mb-1">Media posting requires verification badge</p>
                  <p className="text-gray-400 text-xs mb-2">Purchase a verification badge to unlock image and video posting. Only text posts are available without a badge.</p>
                  <Link href="/verification-badge">
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all">
                      Get Verified Badge - ₦2,000/month
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
