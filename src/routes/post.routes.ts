import { Router, Request, Response } from 'express';
import { authenticate, requireKYC, optionalAuthenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { postController, uploadMiddleware } from '../controllers/post.controller';
import { commentController } from '../controllers/comment.controller';
import { reportController } from '../controllers/report.controller';

const router = Router();

// GET /api/posts - Get posts (with filters)
router.get('/', optionalAuthenticate, asyncHandler(postController.getPosts));

// GET /api/posts/feed - Get social feed (following + own posts)
router.get('/feed', authenticate, asyncHandler(postController.getSocialFeed));

// GET /api/posts/trending - Get trending posts
router.get('/trending', authenticate, asyncHandler(postController.getTrendingPosts));

// POST /api/posts - Create new post (removed KYC requirement for marketplace)
router.post('/', authenticate, asyncHandler(postController.createPost));

// GET /api/posts/search - Search posts
router.get('/search', optionalAuthenticate, asyncHandler(postController.searchPosts));

// GET /api/posts/user/:userId - Get user's posts
router.get('/user/:userId', optionalAuthenticate, asyncHandler(postController.getUserPosts));

// GET /api/posts/bookmarks - Get user's bookmarked posts
router.get('/bookmarks', authenticate, asyncHandler(postController.getBookmarkedPosts));

// POST /api/posts/upload-media - Upload media files (removed KYC requirement for social posts)
router.post('/upload-media', authenticate, uploadMiddleware, asyncHandler(postController.uploadMedia));

// GET /api/posts/:postId - Get post by ID
router.get('/:postId', optionalAuthenticate, asyncHandler(postController.getPostById));

// PUT /api/posts/:postId - Update post
router.put('/:postId', authenticate, requireKYC, asyncHandler(postController.updatePost));

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', authenticate, asyncHandler(postController.deletePost));

// POST /api/posts/:postId/like - Like/unlike post (removed KYC requirement)
router.post('/:postId/like', authenticate, asyncHandler(postController.toggleLike));

// POST /api/posts/:postId/bookmark - Bookmark/unbookmark post
router.post('/:postId/bookmark', authenticate, asyncHandler(postController.toggleBookmark));

// GET /api/posts/:postId/comments - Get post comments
router.get('/:postId/comments', optionalAuthenticate, asyncHandler(commentController.getPostComments));

// POST /api/posts/:postId/comments - Add comment to post (KYC not required)
router.post('/:postId/comments', authenticate, asyncHandler(commentController.createComment));

// PUT /api/posts/:postId/comments/:commentId - Update comment
router.put('/:postId/comments/:commentId', authenticate, asyncHandler(commentController.updateComment));

// DELETE /api/posts/:postId/comments/:commentId - Delete comment
router.delete('/:postId/comments/:commentId', authenticate, asyncHandler(commentController.deleteComment));

// POST /api/posts/:postId/report - Report post
router.post('/:postId/report', authenticate, asyncHandler(reportController.reportPost));

export default router;