import { Router, Request, Response } from 'express';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { gameController } from '../controllers/game.controller';

const router = Router();

// GET /api/games - Get all active games
router.get('/', optionalAuthenticate, asyncHandler(gameController.getGames.bind(gameController)));

// GET /api/games/featured - Get featured games
router.get('/featured', optionalAuthenticate, asyncHandler(gameController.getFeaturedGames.bind(gameController)));

// GET /api/games/categories - Get game categories
router.get('/categories', optionalAuthenticate, asyncHandler(gameController.getGameCategories.bind(gameController)));

// GET /api/games/search - Search games
router.get('/search', optionalAuthenticate, asyncHandler(gameController.searchGames.bind(gameController)));

// GET /api/games/popular - Get popular games
router.get('/popular', optionalAuthenticate, asyncHandler(gameController.getPopularGames.bind(gameController)));

// GET /api/games/:gameId - Get game by ID
router.get('/:gameId', optionalAuthenticate, asyncHandler(gameController.getGameById.bind(gameController)));

// GET /api/games/:gameId/posts - Get posts for a specific game
router.get('/:gameId/posts', optionalAuthenticate, asyncHandler(gameController.getPostsByGame.bind(gameController)));

export default router;