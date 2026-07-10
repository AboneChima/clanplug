import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Local File Storage Service
 * Replaces Cloudinary/Supabase with local disk storage on VPS
 */

// Base upload directory
const UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || '/var/www/clanplug/uploads';
const UPLOAD_URL_BASE = process.env.UPLOAD_URL_BASE || 'https://api.clanplug.site/uploads';

// Create upload directories if they don't exist
const ensureUploadDirs = () => {
  const dirs = [
    path.join(UPLOAD_BASE_DIR, 'images'),
    path.join(UPLOAD_BASE_DIR, 'videos'),
    path.join(UPLOAD_BASE_DIR, 'avatars'),
    path.join(UPLOAD_BASE_DIR, 'marketplace'),
    path.join(UPLOAD_BASE_DIR, 'temp')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Initialize directories
ensureUploadDirs();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on file type
    let folder = 'images';
    
    if (file.mimetype.startsWith('video/')) {
      folder = 'videos';
    } else if (req.path?.includes('avatar')) {
      folder = 'avatars';
    } else if (req.path?.includes('marketplace')) {
      folder = 'marketplace';
    }

    const uploadPath = path.join(UPLOAD_BASE_DIR, folder);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed image types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  // Allowed video types
  const allowedVideoTypes = /mp4|mpeg|avi|mov|wmv|flv|webm/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (mimetype.startsWith('image/')) {
    if (allowedImageTypes.test(extname.slice(1)) && allowedImageTypes.test(mimetype.split('/')[1])) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
  } else if (mimetype.startsWith('video/')) {
    if (allowedVideoTypes.test(extname.slice(1))) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (mp4, mpeg, avi, mov, wmv, flv, webm) are allowed'));
    }
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

// Multer upload middleware
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter
});

// Upload single file
export const uploadSingle = upload.single('file');

// Upload multiple files
export const uploadMultiple = upload.array('files', 10); // Max 10 files

/**
 * Process and optimize uploaded image
 */
export const optimizeImage = async (filePath: string): Promise<string> => {
  try {
    const optimizedPath = filePath.replace(/\.[^.]+$/, '_optimized.jpg');
    
    await sharp(filePath)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(optimizedPath);

    // Delete original file
    fs.unlinkSync(filePath);
    
    // Rename optimized file to original name
    fs.renameSync(optimizedPath, filePath.replace(/\.[^.]+$/, '.jpg'));
    
    return filePath.replace(/\.[^.]+$/, '.jpg');
  } catch (error) {
    console.error('Image optimization error:', error);
    return filePath; // Return original if optimization fails
  }
};

/**
 * Create thumbnail from image
 */
export const createThumbnail = async (filePath: string, width: number = 300): Promise<string> => {
  try {
    const ext = path.extname(filePath);
    const thumbnailPath = filePath.replace(ext, `_thumb${ext}`);
    
    await sharp(filePath)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80
      })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    throw error;
  }
};

/**
 * Create thumbnail from video using ffmpeg
 */
export const createVideoThumbnail = async (videoPath: string): Promise<string> => {
  try {
    const ext = path.extname(videoPath);
    const thumbnailPath = videoPath.replace(ext, '_thumb.jpg');
    
    // Use ffmpeg to extract frame at 0.5 seconds
    const command = `ffmpeg -i "${videoPath}" -ss 00:00:00.5 -vframes 1 -q:v 2 "${thumbnailPath}"`;
    
    await execAsync(command);
    
    console.log(`✅ Video thumbnail created: ${thumbnailPath}`);
    return thumbnailPath;
  } catch (error) {
    console.error('❌ Video thumbnail creation error:', error);
    // Return empty string if thumbnail generation fails
    return '';
  }
};

/**
 * Get public URL for uploaded file
 */
export const getFileUrl = (filePath: string): string => {
  // Convert absolute path to URL
  const relativePath = filePath.replace(UPLOAD_BASE_DIR, '');
  return `${UPLOAD_URL_BASE}${relativePath}`;
};

/**
 * Delete file from storage
 */
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      // Also delete thumbnail if exists
      const ext = path.extname(filePath);
      const thumbnailPath = filePath.replace(ext, `_thumb${ext}`);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
};

/**
 * Delete file by URL
 */
export const deleteFileByUrl = (url: string): boolean => {
  try {
    // Convert URL back to file path
    const relativePath = url.replace(UPLOAD_URL_BASE, '');
    const filePath = path.join(UPLOAD_BASE_DIR, relativePath);
    return deleteFile(filePath);
  } catch (error) {
    console.error('File deletion by URL error:', error);
    return false;
  }
};

/**
 * Get file size in bytes
 */
export const getFileSize = (filePath: string): number => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

/**
 * Get total storage usage
 */
export const getStorageUsage = (): { total: number; byType: any } => {
  const folders = ['images', 'videos', 'avatars', 'marketplace'];
  const usage: any = {
    total: 0,
    byType: {}
  };

  folders.forEach(folder => {
    const folderPath = path.join(UPLOAD_BASE_DIR, folder);
    let folderSize = 0;

    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      files.forEach(file => {
        const filePath = path.join(folderPath, file);
        folderSize += getFileSize(filePath);
      });
    }

    usage.byType[folder] = folderSize;
    usage.total += folderSize;
  });

  return usage;
};

/**
 * Clean up old temporary files (older than 24 hours)
 */
export const cleanupTempFiles = (): number => {
  const tempDir = path.join(UPLOAD_BASE_DIR, 'temp');
  let deletedCount = 0;

  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > oneDayMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
  }

  return deletedCount;
};

// Schedule cleanup every 6 hours
setInterval(() => {
  const deleted = cleanupTempFiles();
  if (deleted > 0) {
    console.log(`🧹 Cleaned up ${deleted} temporary files`);
  }
}, 6 * 60 * 60 * 1000);

export default {
  upload,
  uploadSingle,
  uploadMultiple,
  optimizeImage,
  createThumbnail,
  getFileUrl,
  deleteFile,
  deleteFileByUrl,
  getFileSize,
  getStorageUsage,
  cleanupTempFiles
};
