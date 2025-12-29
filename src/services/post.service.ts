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
      // Check if user is verified for unlimited posts
      const user = await prisma.user.findUnique({
        where: { id: authorId },
        include: { verificationBadge: true },
      });

      // Check if user is verified
      const verificationBadge = await prisma.verificationBadge.findUnique({
        where: { userId: authorId },
      });

      const isVerified = verificationBadge?.status === 'verified' && 
                        verificationBadge?.expiresAt && 
                        new Date() < verificationBadge.expiresAt;

      // MARKETPLACE: No restrictions - all users can post with images/videos
      // Only apply limits to SOCIAL FEED posts
      if (!isVerified && payload.type === 'SOCIAL_POST') {
        // For SOCIAL FEED posts, check total limit (20 posts) and image restriction
        const totalSocialPostsCount = await prisma.post.count({
          where: { 
            userId: authorId,
            type: 'SOCIAL_POST'
          },
        });

        if (totalSocialPostsCount >= 20) {
          return { 
            success: false, 
            message: 'Social post limit reached (20 posts). Get verified for unlimited posts!', 
            error: 'POST_LIMIT_REACHED' 
          };
        }
        
        // SOCIAL FEED: Block images for non-verified users
        if (payload.images && payload.images.length > 0) {
          return {
            success: false,
            message: 'Image posting on social feed requires verification. Text posts are allowed.',
            error: 'VERIFICATION_REQUIRED'
          };
        }
      }

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
              isKYCVerified: true,
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

    // Get user's bookmarks (if table exists)
    let bookmarkedPostIds: string[] = [];
    if (userId) {
      try {
        const bookmarks = await prisma.bookmark.findMany({
          where: { userId },
          select: { postId: true },
        });
        bookmarkedPostIds = bookmarks.map(b => b.postId);
      } catch (err) {
        // Bookmarks table doesn't exist yet, continue without bookmarks
        console.log('Bookmarks table not ready, skipping bookmark check');
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
              isKYCVerified: true,
              verificationBadge: {
                select: {
                  status: true,
                  expiresAt: true,
                },
              },
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
      isBookmarked: userId ? bookmarkedPostIds.includes(post.id) : false,
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
              avatar: true,
              isKYCVerified: true,
              verificationBadge: {
                select: {
                  status: true,
                  expiresAt: true,
                },
              },
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
              isKYCVerified: true,
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

        // Send notification to post owner (if not liking own post)
        if (post.userId !== userId) {
          try {
            const liker = await prisma.user.findUnique({
              where: { id: userId },
              select: { firstName: true, lastName: true, username: true }
            });

            const likerName = liker?.firstName && liker?.lastName
              ? `${liker.firstName} ${liker.lastName}`
              : liker?.username || 'Someone';

            await prisma.notification.create({
              data: {
                userId: post.userId,
                type: 'POST',
                title: 'New Like',
                message: `${likerName} liked your post`,
                data: {
                  postId: postId,
                  likerId: userId,
                  likerName: likerName
                }
              }
            });
          } catch (notifError) {
            console.error('Failed to send like notification:', notifError);
          }
        }
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
  async uploadMedia(
    buffer: Buffer, 
    filename: string, 
    folder: string = 'lordmoon/posts',
    postType?: string
  ): Promise<{ success: boolean; url?: string; message: string; error?: string; duration?: number }> {
    try {
      if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
        return { success: false, message: 'Cloud storage is not configured', error: 'CLOUDINARY_NOT_CONFIGURED' };
      }

      const isVideo = filename.match(/\.(mp4|mov|avi|wmv|flv|webm)$/i);
      
      // Check if it's a social media marketplace listing (should only allow images)
      if (postType === 'SOCIAL_MEDIA_LISTING' && isVideo) {
        return { 
          success: false, 
          message: 'Social media marketplace only allows images, not videos', 
          error: 'VIDEO_NOT_ALLOWED_FOR_SOCIAL' 
        };
      }

      const uploadResult: any = await new Promise((resolve, reject) => {
        const uploadOptions: any = {
          folder,
          public_id: filename.replace(/\.[^/.]+$/, ''),
          resource_type: 'auto',
          overwrite: true,
        };

        // For game marketplace videos, add duration limit (120 seconds = 2 minutes)
        if (isVideo && postType === 'GAME_ACCOUNT') {
          uploadOptions.eager = [
            { duration: '0-120' } // Limit to first 2 minutes
          ];
        }

        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        stream.end(buffer);
      });

      // Check video duration for game marketplace
      if (isVideo && postType === 'GAME_ACCOUNT' && uploadResult.duration) {
        if (uploadResult.duration > 120) {
          // Delete the uploaded video since it exceeds limit
          await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: 'video' });
          return { 
            success: false, 
            message: 'Video duration exceeds 2 minutes limit for game marketplace', 
            error: 'VIDEO_TOO_LONG',
            duration: uploadResult.duration
          };
        }
      }

      return { 
        success: true, 
        url: uploadResult.secure_url, 
        message: 'Media uploaded successfully',
        duration: uploadResult.duration 
      };
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
                isKYCVerified: true,
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
                isKYCVerified: true,
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

      try {
        // Check if bookmark exists
        const existingBookmark = await prisma.bookmark.findUnique({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });

        let isBookmarked: boolean;

        if (existingBookmark) {
          // Remove bookmark
          await prisma.bookmark.delete({
            where: {
              userId_postId: {
                userId,
                postId,
              },
            },
          });
          isBookmarked = false;
        } else {
          // Add bookmark
          await prisma.bookmark.create({
            data: {
              userId,
              postId,
            },
          });
          isBookmarked = true;
        }

        return {
          success: true,
          isBookmarked,
          message: isBookmarked ? 'Post bookmarked' : 'Bookmark removed',
        };
      } catch (dbError: any) {
        // If bookmarks table doesn't exist yet, return success anyway
        console.log('Bookmarks table not ready yet, using fallback');
        return {
          success: true,
          isBookmarked: true,
          message: 'Bookmark feature coming soon (database migration pending)',
        };
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return { success: false, message: 'Failed to toggle bookmark' };
    }
  },

  // Get user's bookmarked posts
  async getBookmarkedPosts(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [bookmarks, total] = await Promise.all([
        prisma.bookmark.findMany({
          where: { userId },
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    isKYCVerified: true,
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
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.bookmark.count({ where: { userId } }),
      ]);

      const posts = bookmarks.map(bookmark => ({
        ...bookmark.post,
        isLiked: bookmark.post.likes.length > 0,
        isBookmarked: true,
        likes: undefined,
      }));

      return {
        success: true,
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error('Error fetching bookmarked posts:', error);
      // If bookmarks table doesn't exist, return empty array
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('Bookmarks table not ready yet, returning empty array');
        return {
          success: true,
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
      return { success: false, message: 'Failed to fetch bookmarked posts' };
    }
  },

  // Get all posts for social feed with TikTok-style algorithm (no consecutive posts from same user)
  async getSocialFeed(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      // Fetch more posts than needed to allow for filtering
      const fetchLimit = limit * 3;

      // Get user's bookmarks (if table exists)
      let bookmarkedPostIds: string[] = [];
      try {
        const bookmarks = await prisma.bookmark.findMany({
          where: { userId },
          select: { postId: true },
        });
        bookmarkedPostIds = bookmarks.map(b => b.postId);
      } catch (err) {
        // Bookmarks table doesn't exist yet, continue without bookmarks
        console.log('Bookmarks table not ready, skipping bookmark check');
      }

      const [allPosts, total] = await Promise.all([
        prisma.post.findMany({
          where: {
            status: { in: [PostStatus.ACTIVE, PostStatus.SOLD] }, // Include SOLD posts
            type: { in: ['SOCIAL_POST', 'MARKETPLACE_LISTING'] },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                isKYCVerified: true,
                verificationBadge: {
                  select: {
                    status: true,
                    expiresAt: true,
                  },
                },
              },
            },
            soldTo: {
              select: {
                id: true,
                username: true,
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
          // NO orderBy - get posts in random database order
          take: fetchLimit,
        }),
        prisma.post.count({
          where: {
            status: { in: [PostStatus.ACTIVE, PostStatus.SOLD] }, // Include SOLD posts
            type: { in: ['SOCIAL_POST', 'MARKETPLACE_LISTING'] },
          },
        }),
      ]);

      // TikTok-style FYP algorithm: Fully randomize on every request
      // Use Math.random() so it changes on every refresh
      const shuffledPosts = [...allPosts].sort(() => Math.random() - 0.5);

      // TikTok-style algorithm: Mix posts so no consecutive posts from same user
      const mixedPosts: any[] = [];
      const remainingPosts = [...shuffledPosts];
      let lastUserId: string | null = null;

      while (mixedPosts.length < limit && remainingPosts.length > 0) {
        // Find a post from a different user than the last one
        const postIndex = remainingPosts.findIndex(post => post.userId !== lastUserId);
        
        if (postIndex === -1) {
          // If all remaining posts are from the same user, just take the first one
          const post = remainingPosts.shift();
          if (post) {
            mixedPosts.push(post);
            lastUserId = post.userId;
          }
        } else {
          // Take the post from a different user
          const [post] = remainingPosts.splice(postIndex, 1);
          mixedPosts.push(post);
          lastUserId = post.userId;
        }
      }

      // Get follow status for all users in the feed
      const userIds = [...new Set(mixedPosts.map(post => post.userId))];
      
      // Check who the current user is following
      const followStatuses = await prisma.follow.findMany({
        where: {
          followerId: userId,
          followingId: { in: userIds },
        },
        select: { followingId: true },
      });
      const followingIds = new Set(followStatuses.map(f => f.followingId));

      // Check who is following the current user back (for mutual/friends status)
      const followersStatuses = await prisma.follow.findMany({
        where: {
          followerId: { in: userIds },
          followingId: userId,
        },
        select: { followerId: true },
      });
      const followerIds = new Set(followersStatuses.map(f => f.followerId));

      const postsWithLikeStatus = mixedPosts.map(post => {
        const isFollowing = followingIds.has(post.userId);
        const isFollower = followerIds.has(post.userId);
        const isMutual = isFollowing && isFollower;

        return {
          ...post,
          isLiked: post.likes.length > 0,
          isBookmarked: bookmarkedPostIds.includes(post.id),
          user: {
            ...post.user,
            isFollowing,
            isMutual,
          },
          likes: undefined,
        };
      });

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
