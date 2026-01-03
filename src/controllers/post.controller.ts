import { Request, Response } from 'express';
import { postService, CreatePostPayload, UpdatePostPayload } from '../services/post.service';
import { PostStatus } from '@prisma/client';
import multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    const postType = req.body.postType;
    
    // Social media marketplace: only images
    if (postType === 'SOCIAL_ACCOUNT' && file.mimetype.startsWith('video/')) {
      cb(new Error('Social media marketplace only allows images, not videos'));
      return;
    }
    
    // Allow images and videos for other types
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

export const postController = {
  // GET /api/posts - Get posts with filters and pagination
  async getPosts(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        category,
        userId: filterUserId,
        search,
        type,
        minPrice,
        maxPrice,
      } = req.query;

      const userId = (req as any).user?.id;

      const filters: any = {};
      if (category) filters.category = category as string;
      if (filterUserId) filters.userId = filterUserId as string;
      if (search) filters.search = search as string;
      if (type) filters.type = type as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);

      const result = await postService.getPosts(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      res.json({
        success: true,
        data: result.posts,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve posts',
        error: error.message,
      });
    }
  },

  // POST /api/posts - Create new post
  async createPost(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        description,
        category,
        tags,
        images,
        videos,
        price,
        currency,
        type,
        gameTitle,
        platform,
        accountLevel,
        accountDetails,
        location,
        isNegotiable,
      } = req.body;

      if (!title || !description || !type) {
        res.status(400).json({
          success: false,
          message: 'Title, description, and type are required',
        });
        return;
      }

      const authorId = (req as any).user.id;
      
      // Check KYC verification for MARKETPLACE posts
      const isMarketplacePost = type === 'MARKETPLACE_LISTING' || type === 'GAME_ACCOUNT';
      
      if (isMarketplacePost) {
        const user = await import('../config/database').then(m => m.prisma.user.findUnique({
          where: { id: authorId },
          select: { isKYCVerified: true }
        }));
        
        if (!user?.isKYCVerified) {
          res.status(403).json({
            success: false,
            message: 'KYC verification required to post on marketplace. Please complete KYC verification.',
          });
          return;
        }
      }
      
      // Check verification badge for SOCIAL_POST with media
      const hasMedia = (images && images.length > 0) || (videos && videos.length > 0);
      const isSocialPost = type === 'SOCIAL_POST';
      
      if (hasMedia && isSocialPost) {
        const { verificationService } = await import('../services/verification.service');
        const canPostMedia = await verificationService.canPostMedia(authorId);
        
        if (!canPostMedia) {
          res.status(403).json({
            success: false,
            message: 'Verification badge required to post images on social feed. Text posts are allowed.',
          });
          return;
        }
      }

      const payload: CreatePostPayload = {
        title,
        description,
        category,
        tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
        images: Array.isArray(images) ? images : (images ? [images] : []),
        videos: Array.isArray(videos) ? videos : (videos ? [videos] : []),
        price: price ? parseFloat(price) : undefined,
        currency,
        type,
        gameTitle,
        platform,
        accountLevel,
        accountDetails,
        location,
        isNegotiable: isNegotiable === true || isNegotiable === 'true',
      };

      const result = await postService.createPost(authorId, payload);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: result.post,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: error.message,
      });
    }
  },

  // GET /api/posts/:postId - Get post by ID
  async getPostById(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = (req as any).user?.id;

      const result = await postService.getPostById(postId, userId);

      if (result.success) {
        res.json({
          success: true,
          data: result.post,
        });
      } else {
        const statusCode = result.error === 'POST_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve post',
        error: error.message,
      });
    }
  },

  // PUT /api/posts/:postId - Update post
  async updatePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const {
        title,
        description,
        category,
        tags,
        images,
        videos,
        price,
        currency,
        status,
        gameTitle,
        platform,
        accountLevel,
        accountDetails,
        location,
        isNegotiable,
      } = req.body;

      const authorId = (req as any).user.id;

      const payload: UpdatePostPayload = {};
      if (title !== undefined) payload.title = title;
      if (description !== undefined) payload.description = description;
      if (category !== undefined) payload.category = category;
      if (tags !== undefined) payload.tags = Array.isArray(tags) ? tags : (tags ? [tags] : []);
      if (images !== undefined) payload.images = Array.isArray(images) ? images : (images ? [images] : []);
      if (videos !== undefined) payload.videos = Array.isArray(videos) ? videos : (videos ? [videos] : []);
      if (price !== undefined) payload.price = price ? parseFloat(price) : null;
      if (currency !== undefined) payload.currency = currency;
      if (status !== undefined) payload.status = status as PostStatus;
      if (gameTitle !== undefined) payload.gameTitle = gameTitle;
      if (platform !== undefined) payload.platform = platform;
      if (accountLevel !== undefined) payload.accountLevel = accountLevel;
      if (accountDetails !== undefined) payload.accountDetails = accountDetails;
      if (location !== undefined) payload.location = location;
      if (isNegotiable !== undefined) payload.isNegotiable = isNegotiable;

      const result = await postService.updatePost(postId, authorId, payload);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.post,
        });
      } else {
        const statusCode = result.error === 'POST_NOT_FOUND' ? 404 : 
                          result.error === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: error.message,
      });
    }
  },

  // DELETE /api/posts/:postId - Delete post
  async deletePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const authorId = (req as any).user.id;

      const result = await postService.deletePost(postId, authorId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
        });
      } else {
        const statusCode = result.error === 'POST_NOT_FOUND' ? 404 : 
                          result.error === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete post',
        error: error.message,
      });
    }
  },

  // POST /api/posts/:postId/like - Like/unlike post
  async toggleLike(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = (req as any).user.id;

      const result = await postService.toggleLike(postId, userId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            isLiked: result.isLiked,
            likesCount: result.likesCount,
          },
        });
      } else {
        const statusCode = result.error === 'POST_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle like',
        error: error.message,
      });
    }
  },

  // POST /api/posts/upload-media - Upload media files
  async uploadMedia(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const files = req.files as Express.Multer.File[];
      const { postType } = req.body; // Get post type to enforce rules
      
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
        return;
      }

      // Check if user has verification badge for media uploads
      const { verificationService } = await import('../services/verification.service');
      const canPost = await verificationService.canPostMedia(userId);
      
      if (!canPost) {
        res.status(403).json({
          success: false,
          message: 'Complete KYC verification to post images and videos. Visit your profile to get verified!',
          error: 'VERIFICATION_REQUIRED',
        });
        return;
      }

      const uploadPromises = files.map(async (file) => {
        const filename = `${Date.now()}-${file.originalname}`;
        return postService.uploadMedia(file.buffer, filename, 'lordmoon/posts', postType);
      });

      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);

      if (successfulUploads.length === 0) {
        res.status(400).json({
          success: false,
          message: 'All uploads failed',
          errors: failedUploads.map(f => ({ error: f.error, message: f.message })),
        });
        return;
      }

      res.json({
        success: true,
        message: `${successfulUploads.length} file(s) uploaded successfully`,
        data: {
          urls: successfulUploads.map(result => result.url),
          failed: failedUploads.length,
          failedReasons: failedUploads.map(f => f.message),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to upload media',
        error: error.message,
      });
    }
  },

  // GET /api/posts/search - Search posts
  async searchPosts(req: Request, res: Response): Promise<void> {
    try {
      const {
        q,
        page = '1',
        limit = '20',
        category,
        isService,
      } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
        return;
      }

      const filters: any = {};
      if (category) filters.category = category as string;
      if (isService !== undefined) filters.isService = isService === 'true';

      const result = await postService.searchPosts(
        q,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      res.json({
        success: true,
        data: result.posts,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to search posts',
        error: error.message,
      });
    }
  },

  // GET /api/posts/user/:userId - Get user's posts
  async getUserPosts(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      const result = await postService.getUserPosts(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: result.posts,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user posts',
        error: error.message,
      });
    }
  },

  // GET /api/posts/feed - Get social feed
  async getSocialFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000; // Show all posts

      const result = await postService.getSocialFeed(userId, page, limit);

      if (result.success) {
        res.json({
          success: true,
          data: result.posts,
          pagination: result.pagination,
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch social feed',
        error: error.message,
      });
    }
  },

  // GET /api/posts/trending - Get trending posts
  async getTrendingPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await postService.getTrendingPosts(userId, page, limit);

      if (result.success) {
        res.json({
          success: true,
          data: result.posts,
          pagination: result.pagination,
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trending posts',
        error: error.message,
      });
    }
  },

  // POST /api/posts/:postId/bookmark - Toggle bookmark
  async toggleBookmark(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { postId } = req.params;

      const result = await postService.toggleBookmark(postId, userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle bookmark',
        error: error.message,
      });
    }
  },

  // GET /api/posts/bookmarks - Get user's bookmarked posts
  async getBookmarkedPosts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000; // Show all bookmarks

      const result = await postService.getBookmarkedPosts(userId, page, limit);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookmarked posts',
        error: error.message,
      });
    }
  },
};

// Export multer upload middleware for use in routes
export const uploadMiddleware = upload.array('media', 5); // Allow up to 5 files

export default postController;