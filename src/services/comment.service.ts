import { prisma } from '../config/database';
import { Comment, User } from '@prisma/client';

export type CreateCommentPayload = {
  content: string;
  parentId?: string;
};

export type UpdateCommentPayload = {
  content: string;
};

export type CommentWithAuthor = Comment & {
  user: Pick<User, 'id' | 'username' | 'firstName' | 'lastName' | 'avatar'>;
  replies?: CommentWithAuthor[];
  _count?: {
    replies: number;
  };
  isLiked?: boolean;
};

export const commentService = {
  // Create a new comment
  async createComment(
    postId: string, 
    userId: string, 
    payload: CreateCommentPayload
  ): Promise<{ success: boolean; comment?: CommentWithAuthor; message: string; error?: string }> {
    try {
      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        return { success: false, message: 'Post not found', error: 'POST_NOT_FOUND' };
      }

      // If parentId is provided, check if parent comment exists
      if (payload.parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: payload.parentId },
        });

        if (!parentComment) {
          return { success: false, message: 'Parent comment not found', error: 'PARENT_COMMENT_NOT_FOUND' };
        }

        if (parentComment.postId !== postId) {
          return { success: false, message: 'Parent comment does not belong to this post', error: 'INVALID_PARENT_COMMENT' };
        }
      }

      const comment = await prisma.comment.create({
        data: {
          userId,
          postId,
          parentId: payload.parentId,
          content: payload.content,
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
              replies: true,
            },
          },
        },
      });

      // Update post comment count
      await prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return { success: true, comment: comment as CommentWithAuthor, message: 'Comment created successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to create comment', error: error.message || 'CREATE_COMMENT_ERROR' };
    }
  },

  // Get comments for a post
  async getPostComments(
    postId: string,
    userId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ comments: CommentWithAuthor[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId,
          parentId: null, // Only get top-level comments
        },
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
              avatar: true,
            },
          },
          replies: {
            take: 3, // Get first 3 replies
            orderBy: { createdAt: 'asc' },
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
                  replies: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      prisma.comment.count({
        where: {
          postId,
          parentId: null,
        },
      }),
    ]);

    // Add isLiked status if userId is provided
    const commentsWithLikeStatus = comments.map(comment => ({
      ...comment,
      isLiked: false, // TODO: Implement comment likes if needed
      replies: comment.replies?.map(reply => ({
        ...reply,
        isLiked: false, // TODO: Implement comment likes if needed
      })),
    })) as CommentWithAuthor[];

    return {
      comments: commentsWithLikeStatus,
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

  // Get replies for a comment
  async getCommentReplies(
    commentId: string,
    userId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ replies: CommentWithAuthor[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          parentId: commentId,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
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
              replies: true,
            },
          },
        },
      }),
      prisma.comment.count({
        where: {
          parentId: commentId,
        },
      }),
    ]);

    const repliesWithLikeStatus = replies.map(reply => ({
      ...reply,
      isLiked: false, // TODO: Implement comment likes if needed
    })) as CommentWithAuthor[];

    return {
      replies: repliesWithLikeStatus,
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

  // Get comment by ID
  async getCommentById(
    commentId: string,
    userId?: string
  ): Promise<{ success: boolean; comment?: CommentWithAuthor; message: string; error?: string }> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
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
              replies: true,
            },
          },
        },
      });

      if (!comment) {
        return { success: false, message: 'Comment not found', error: 'COMMENT_NOT_FOUND' };
      }

      const commentWithLikeStatus = {
        ...comment,
        isLiked: false, // TODO: Implement comment likes if needed
      } as CommentWithAuthor;

      return { success: true, comment: commentWithLikeStatus, message: 'Comment retrieved successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to retrieve comment', error: error.message || 'GET_COMMENT_ERROR' };
    }
  },

  // Update comment
  async updateComment(
    commentId: string,
    userId: string,
    payload: UpdateCommentPayload
  ): Promise<{ success: boolean; comment?: CommentWithAuthor; message: string; error?: string }> {
    try {
      // Check if comment exists and user is the author
      const existingComment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!existingComment) {
        return { success: false, message: 'Comment not found', error: 'COMMENT_NOT_FOUND' };
      }

      if (existingComment.userId !== userId) {
        return { success: false, message: 'Unauthorized to update this comment', error: 'UNAUTHORIZED' };
      }

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: payload.content,
          isEdited: true,
          updatedAt: new Date(),
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
              replies: true,
            },
          },
        },
      });

      const commentWithLikeStatus = {
        ...updatedComment,
        isLiked: false, // TODO: Implement comment likes if needed
      } as CommentWithAuthor;

      return { success: true, comment: commentWithLikeStatus, message: 'Comment updated successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to update comment', error: error.message || 'UPDATE_COMMENT_ERROR' };
    }
  },

  // Delete comment
  async deleteComment(
    commentId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Check if comment exists and user is the author
      const existingComment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

      if (!existingComment) {
        return { success: false, message: 'Comment not found', error: 'COMMENT_NOT_FOUND' };
      }

      if (existingComment.userId !== userId) {
        return { success: false, message: 'Unauthorized to delete this comment', error: 'UNAUTHORIZED' };
      }

      // Delete comment and all its replies (cascade delete)
      await prisma.comment.delete({
        where: { id: commentId },
      });

      // Update post comment count (subtract 1 + number of replies)
      const deletedCount = 1 + existingComment._count.replies;
      await prisma.post.update({
        where: { id: existingComment.postId },
        data: { commentCount: { decrement: deletedCount } },
      });

      return { success: true, message: 'Comment deleted successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to delete comment', error: error.message || 'DELETE_COMMENT_ERROR' };
    }
  },

  // Get user's comments
  async getUserComments(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ comments: CommentWithAuthor[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { userId },
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
              avatar: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      prisma.comment.count({
        where: { userId },
      }),
    ]);

    const commentsWithLikeStatus = comments.map(comment => ({
      ...comment,
      isLiked: false, // TODO: Implement comment likes if needed
    })) as CommentWithAuthor[];

    return {
      comments: commentsWithLikeStatus,
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
};

export default commentService;