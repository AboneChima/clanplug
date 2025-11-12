import { prisma } from '../config/database';
import { Post, PostStatus, User, Currency, PostType } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config';

// Configure Cloudinary if credentials are provided
if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type CreatePostPayload = {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  images?: string[];
  videos?: string[];
  price?: number;
  currency?: string;
  type: string;
  gameTitle?: string;
  platform?: string;
  accountLevel?: string;
  accountDetails?: any;
  location?: string;
  isNegotiable?: boolean;
};

export type UpdatePostPayload = {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  images?: string[];
  videos?: string[];
  price?: number | null;
  currency?: string;
  status?: PostStatus;
  gameTitle?: string;
  platform?: string;
  accountLevel?: string;
  accountDetails?: any;
  location?: string;
  isNegotiable?: boolean;
};

export type PostWithAuthor = Post & {
  user: Pick<User, 'id' | 'username' | 'firstName' | 'lastName'>;
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
};

export const postService = {
  // Create a new post
  async createPost(authorId: string, payload: CreatePostPayload): Promise<{ success: boolean; post?: PostWithAuthor; message: string; error?: string }> {
    try {
      const post = await prisma.post.create({
        data: {
          userId: authorId,
          type: payload.type as PostType,
          title: payload.title,
          description: payload.description,
          category: payload.category,
          tags: payload.tags || [],
          images: payload.images || [],
          videos: payload.videos || [],
          price: payload.price,
          currency: payload.currency as Currency || null,
          gameTitle: payload.gameTitle,
          platform: payload.platform,
          accountLevel: payload.accountLevel,
          accountDetails: payload.accountDetails,
          location: payload.location,
          isNegotiable: payload.isNegotiable || false,
          status: PostStatus.ACTIVE,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return { success: true, post: post as PostWithAuthor, message: 'Post created successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to create post', error: error.message || 'CREATE_POST_ERROR' };
    }
  },

  // Get posts with pagination and filters
  async getPosts(
    userId?: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      category?: string;
      userId?: string;
      search?: string;
      type?: string;
      minPrice?: number;
      maxPrice?: number;
    }
  ): Promise<{ posts: PostWithAuthor[]; pagination: any }> {
    const skip = (page - 1) * limit;
    
    const where: any = {
      status: PostStatus.ACTIVE,
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.userId) {
        where.userId = filters.userId;
      }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: userId ? {
            where: { userId },
            select: { id: true },
          } : false,
        },
      }),
      prisma.post.count({ where }),
    ]);

    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: userId ? post.likes && post.likes.length > 0 : false,
      likes: undefined, // Remove the likes array from response
    })) as PostWithAuthor[];

    return {
      posts: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  // Get post by ID
  async getPostById(postId: string, userId?: string): Promise<{ success: boolean; post?: PostWithAuthor; message: string; error?: string }> {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId, status: PostStatus.ACTIVE },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: userId ? {
            where: { userId },
            select: { id: true },
          } : false,
        },
      });

      if (!post) {
        return { success: false, message: 'Post not found', error: 'POST_NOT_FOUND' };
      }

      const postWithLikeStatus = {
        ...post,
        isLiked: userId ? post.likes && post.likes.length > 0 : false,
        likes: undefined, // Remove the likes array from response
      } as PostWithAuthor;

      // Increment view count
      await prisma.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      });

      return { success: true, post: postWithLikeStatus, message: 'Post retrieved successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to retrieve post', error: error.message || 'GET_POST_ERROR' };
    }
  },

  // Update post
  async updatePost(postId: string, authorId: string, payload: UpdatePostPayload): Promise<{ success: boolean; post?: PostWithAuthor; message: string; error?: string }> {
    try {
      // Check if post exists and user is the author
      const existingPost = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!existingPost) {
        return { success: false, message: 'Post not found', error: 'POST_NOT_FOUND' };
      }

      if (existingPost.userId !== authorId) {
        return { success: false, message: 'Unauthorized to update this post', error: 'UNAUTHORIZED' };
      }

      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          tags: payload.tags,
          images: payload.images,
          videos: payload.videos,
          price: payload.price,
          currency: payload.currency as Currency || null,
          status: payload.status,
          gameTitle: payload.gameTitle,
          platform: payload.platform,
          accountLevel: payload.accountLevel,
          accountDetails: payload.accountDetails,
          location: payload.location,
          isNegotiable: payload.isNegotiable,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return { success: true, post: updatedPost as PostWithAuthor, message: 'Post updated successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to update post', error: error.message || 'UPDATE_POST_ERROR' };
    }
  },

  // Delete post
  async deletePost(postId: string, authorId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Check if post exists and user is the author
      const existingPost = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!existingPost) {
        return { success: false, message: 'Post not found', error: 'POST_NOT_FOUND' };
      }

      if (existingPost.userId !== authorId) {
        return { success: false, message: 'Unauthorized to delete this post', error: 'UNAUTHORIZED' };
      }

      await prisma.post.delete({
        where: { id: postId },
      });

      return { success: true, message: 'Post deleted successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to delete post', error: error.message || 'DELETE_POST_ERROR' };
    }
  },

  // Like/Unlike post
  async toggleLike(postId: string, userId: string): Promise<{ success: boolean; isLiked: boolean; likesCount: number; message: string; error?: string }> {
    try {
      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId, status: PostStatus.ACTIVE },
      });

      if (!post) {
        return { success: false, isLiked: false, likesCount: 0, message: 'Post not found', error: 'POST_NOT_FOUND' };
      }

      // Check if user already liked the post
      const existingLike = await prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      let isLiked: boolean;
      
      if (existingLike) {
        // Unlike the post
        await prisma.like.delete({
          where: { userId_postId: { userId, postId } },
        });
        isLiked = false;
      } else {
        // Like the post
        await prisma.like.create({
          data: { userId, postId },
        });
        isLiked = true;
      }

      // Get updated likes count
      const likesCount = await prisma.like.count({
        where: { postId },
      });

      return { 
        success: true, 
        isLiked, 
        likesCount, 
        message: isLiked ? 'Post liked successfully' : 'Post unliked successfully' 
      };
    } catch (error: any) {
      return { success: false, isLiked: false, likesCount: 0, message: 'Failed to toggle like', error: error.message || 'TOGGLE_LIKE_ERROR' };
    }
  },

  // Upload media for posts
  async uploadMedia(buffer: Buffer, filename: string, folder: string = 'lordmoon/posts'): Promise<{ success: boolean; url?: string; message: string; error?: string }> {
    try {
      if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
        return { success: false, message: 'Cloud storage is not configured', error: 'CLOUDINARY_NOT_CONFIGURED' };
      }

      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          folder,
          public_id: filename.replace(/\.[^/.]+$/, ''),
          resource_type: 'auto',
          overwrite: true,
        }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        stream.end(buffer);
      });

      return { success: true, url: uploadResult.secure_url, message: 'Media uploaded successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to upload media', error: error.message || 'UPLOAD_ERROR' };
    }
  },

  // Get user's posts
  async getUserPosts(userId: string, page: number = 1, limit: number = 20): Promise<{ posts: PostWithAuthor[]; pagination: any }> {
    return this.getPosts(undefined, page, limit, { userId });
  },

  // Search posts
  async searchPosts(query: string, page: number = 1, limit: number = 20, filters?: { category?: string; type?: string }): Promise<{ posts: PostWithAuthor[]; pagination: any }> {
    return this.getPosts(undefined, page, limit, { search: query, ...filters });
  },

  // Get feed for user (posts from followed users)
  async getFollowingFeed(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      // Get posts from users that current user follows
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            status: PostStatus.ACTIVE,
            user: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            likes: {
              where: { userId },
              select: { id: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.post.count({
          where: {
            status: PostStatus.ACTIVE,
            user: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
        }),
      ]);

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined,
      }));

      return {
        success: true,
        posts: postsWithLikeStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching following feed:', error);
      return { success: false, message: 'Failed to fetch feed' };
    }
  },

  // Get trending posts (most liked/commented in last 7 days)
  async getTrendingPosts(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            status: PostStatus.ACTIVE,
            createdAt: { gte: sevenDaysAgo },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            likes: {
              where: { userId },
              select: { id: true },
            },
          },
          orderBy: [
            { likes: { _count: 'desc' } },
            { comments: { _count: 'desc' } },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        prisma.post.count({
          where: {
            status: PostStatus.ACTIVE,
            createdAt: { gte: sevenDaysAgo },
          },
        }),
      ]);

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined,
      }));

      return {
        success: true,
        posts: postsWithLikeStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      return { success: false, message: 'Failed to fetch trending posts' };
    }
  },

  // Bookmark/Unbookmark post
  async toggleBookmark(postId: string, userId: string) {
    try {
      // Check if already bookmarked (we'll use a simple metadata approach)
      // In production, you'd want a separate Bookmark model
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        return { success: false, message: 'Post not found' };
      }

      // For now, return success (implement proper bookmark model later)
      return {
        success: true,
        isBookmarked: true,
        message: 'Bookmark toggled',
      };
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return { success: false, message: 'Failed to toggle bookmark' };
    }
  },

  // Get all posts for social feed (includes own posts and followed users)
  async getSocialFeed(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            status: PostStatus.ACTIVE,
            OR: [
              { userId }, // Own posts
              {
                user: {
                  followers: {
                    some: {
                      followerId: userId,
                    },
                  },
                },
              },
            ],
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            likes: {
              where: { userId },
              select: { id: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.post.count({
          where: {
            status: PostStatus.ACTIVE,
            OR: [
              { userId },
              {
                user: {
                  followers: {
                    some: {
                      followerId: userId,
                    },
                  },
                },
              },
            ],
          },
        }),
      ]);

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        isLiked: post.likes.length > 0,
        isBookmarked: false, // TODO: Implement bookmark check
        likes: undefined,
      }));

      return {
        success: true,
        posts: postsWithLikeStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching social feed:', error);
      return { success: false, message: 'Failed to fetch feed' };
    }
  },
};



export default postService;
