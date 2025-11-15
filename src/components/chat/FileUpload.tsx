"use client";

import { useState, useRef, useCallback } from 'react';
import { IoCloudUploadOutline, IoCloseOutline, IoDocumentOutline, IoImageOutline } from 'react-icons/io5';
import { chatService, ChatService } from '@/services/chat.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface FileUploadProps {
  onFileUploaded: (url: string, filename: string, type: string) => void;
  onClose: () => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
}

interface UploadingFile {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export default function FileUpload({ 
  onFileUploaded, 
  onClose, 
  maxFileSize = 10,
  allowedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
}: FileUploadProps) {
  const { accessToken } = useAuth();
  const { showToast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    const isAllowed = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return fileType.startsWith(baseType);
      }
      return fileType === type;
    });

    if (!isAllowed) {
      return 'File type not supported';
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    if (!accessToken) {
      showToast('Please log in to upload files', 'error');
      return;
    }

    const validation = validateFile(file);
    if (validation) {
      showToast(validation, 'error');
      return;
    }

    const uploadingFile: UploadingFile = { file, progress: 0 };
    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.file === file && f.progress < 90 
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 200);

      const response = await chatService.uploadFile(accessToken, file);
      clearInterval(progressInterval);

      if (response.success && response.data) {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? { ...f, progress: 100, url: response.data!.url }
              : f
          )
        );

        onFileUploaded(response.data.url, response.data.filename, response.data.type);
        showToast('File uploaded successfully', 'success');
        
        // Remove from uploading list after a delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.file !== file));
        }, 1000);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      setUploadingFiles(prev => 
        prev.map(f => 
          f.file === file 
            ? { ...f, error: error.message }
            : f
        )
      );
      showToast(error.message || 'Failed to upload file', 'error');
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(uploadFile);
  }, [accessToken]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <IoImageOutline className="w-6 h-6 text-blue-500" />;
    }
    return <IoDocumentOutline className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            Upload Files
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <IoCloseOutline className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 hover:border-blue-400 hover:bg-slate-700/30'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <IoCloudUploadOutline className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 mb-2">
              Drag and drop files here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-gray-400">
              Max {maxFileSize}MB • Images, Documents, PDFs
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* Uploading Files */}
          {uploadingFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium text-white">
                Uploading Files
              </h4>
              {uploadingFiles.map((uploadingFile, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-700/50 border border-slate-600 rounded-lg"
                >
                  {getFileIcon(uploadingFile.file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {ChatService.formatFileSize(uploadingFile.file.size)}
                    </p>
                    {uploadingFile.error ? (
                      <p className="text-xs text-red-400 mt-1">{uploadingFile.error}</p>
                    ) : (
                      <div className="mt-2">
                        <div className="w-full bg-slate-600 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadingFile.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {uploadingFile.progress}%
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeUploadingFile(uploadingFile.file)}
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                  >
                    <IoCloseOutline className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}