'use client';

import { useState } from 'react';
import { IoCloudUploadOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoVideocamOutline, IoImageOutline } from 'react-icons/io5';

interface CloudinaryUploadProps {
  onUploadComplete: (url: string, type: 'image' | 'video') => void;
  acceptVideo?: boolean;
  maxSizeMB?: number;
}

export default function CloudinaryUpload({ 
  onUploadComplete, 
  acceptVideo = true,
  maxSizeMB = 10 
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dj1p6uao1';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setError('Please upload an image or video file');
      return;
    }

    if (isVideo && !acceptVideo) {
      setError('Video uploads are not allowed');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'lordmoon');

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onUploadComplete(response.secure_url, isVideo ? 'video' : 'image');
          setUploading(false);
        } else {
          setError('Upload failed. Please try again.');
          setUploading(false);
        }
      });

      xhr.addEventListener('error', () => {
        setError('Upload failed. Please check your connection.');
        setUploading(false);
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? 'video' : 'image'}/upload`);
      xhr.send(formData);
    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept={acceptVideo ? "image/*,video/*" : "image/*"}
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="cloudinary-upload"
      />
      
      <label
        htmlFor="cloudinary-upload"
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          uploading 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        {preview && !uploading ? (
          <div className="relative w-full h-full p-4">
            {preview.startsWith('data:video') ? (
              <video src={preview} className="w-full h-full object-contain rounded-lg" controls />
            ) : (
              <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
            )}
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  className="text-blue-500 transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-500">{progress}%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <IoImageOutline className="w-10 h-10 text-gray-400" />
              {acceptVideo && <IoVideocamOutline className="w-10 h-10 text-gray-400" />}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Click to upload {acceptVideo ? 'image or video' : 'image'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Max size: {maxSizeMB}MB
              </p>
            </div>
            <IoCloudUploadOutline className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </label>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
          <IoCloseCircleOutline className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
