'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoThumbnailProps {
  videoUrl: string;
  alt?: string;
  className?: string;
}

export default function VideoThumbnail({ videoUrl, alt = 'Video thumbnail', className = '' }: VideoThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const handleLoadedData = () => {
      try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current frame to canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to blob and create URL
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setThumbnailUrl(url);
            }
          }, 'image/jpeg', 0.8);
        }
      } catch (err) {
        console.error('Error generating thumbnail:', err);
        setError(true);
      }
    };

    const handleError = () => {
      setError(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    // Start loading video
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      
      // Clean up blob URL
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [videoUrl]);

  return (
    <>
      {/* Hidden video element for thumbnail generation */}
      <video
        ref={videoRef}
        src={videoUrl}
        crossOrigin="anonymous"
        preload="metadata"
        muted
        playsInline
        style={{ display: 'none' }}
      />
      
      {/* Hidden canvas for frame extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Display thumbnail or fallback */}
      {thumbnailUrl && !error ? (
        <img 
          src={thumbnailUrl} 
          alt={alt}
          className={className}
        />
      ) : (
        <div className={`flex items-center justify-center bg-[#1a1a1a] ${className}`}>
          <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </>
  );
}
