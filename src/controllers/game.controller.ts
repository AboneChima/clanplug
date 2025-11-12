import { Request, Response } from 'express';
import { gameService } from '../services/game.service';
import { GameCategory, GameStatus } from '@prisma/client';

export class GameController {
  /**
   * Get all games with filtering and pagination
   */
  async getGames(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        status,
        search,
        isPopular,
        page = '1',
        limit = '20',
        sortBy = 'sortOrder',
        sortOrder = 'asc'
      } = req.query;

      // Validate category
      if (category && !Object.values(GameCategory).includes(category as GameCategory)) {
        res.status(400).json({
          success: false,
          message: 'Invalid game category',
          code: 'INVALID_CATEGORY'
        });
        return;
      }

      // Validate status
      if (status && !Object.values(GameStatus).includes(status as GameStatus)) {
        res.status(400).json({
          success: false,
          message: 'Invalid game status',
          code: 'INVALID_STATUS'
        });
        return;
      }

      // Validate pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          success: false,
          message: 'Invalid page number',
          code: 'INVALID_PAGE'
        });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit (must be between 1 and 100)',
          code: 'INVALID_LIMIT'
        });
        return;
      }

      // Validate sort parameters
      const validSortBy = ['name', 'createdAt', 'sortOrder', 'posts'];
      const validSortOrder = ['asc', 'desc'];

      if (!validSortBy.includes(sortBy as string)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sortBy parameter',
          code: 'INVALID_SORT_BY'
        });
        return;
      }

      if (!validSortOrder.includes(sortOrder as string)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sortOrder parameter',
          code: 'INVALID_SORT_ORDER'
        });
        return;
      }

      const filters = {
        category: category as GameCategory,
        status: status as GameStatus,
        search: search as string,
        isPopular: isPopular === 'true' ? true : isPopular === 'false' ? false : undefined
      };

      const pagination = {
        page: pageNum,
        limit: limitNum,
        sortBy: sortBy as 'name' | 'createdAt' | 'sortOrder' | 'posts',
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await gameService.getGames(filters, pagination);

      res.json({
        success: true,
        message: 'Games retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting games:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get featured games
   */
  async getFeaturedGames(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '10' } = req.query;

      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit (must be between 1 and 50)',
          code: 'INVALID_LIMIT'
        });
        return;
      }

      const games = await gameService.getFeaturedGames(limitNum);

      res.json({
        success: true,
        message: 'Featured games retrieved successfully',
        data: games
      });
    } catch (error) {
      console.error('Error getting featured games:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get game categories
   */
  async getGameCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await gameService.getGameCategories();

      res.json({
        success: true,
        message: 'Game categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      console.error('Error getting game categories:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get game by ID
   */
  async getGameById(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;

      if (!gameId) {
        res.status(400).json({
          success: false,
          message: 'Game ID is required',
          code: 'MISSING_GAME_ID'
        });
        return;
      }

      const game = await gameService.getGameById(gameId);

      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Game not found',
          code: 'GAME_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Game retrieved successfully',
        data: game
      });
    } catch (error) {
      console.error('Error getting game by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get posts for a specific game
   */
  async getPostsByGame(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const {
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      if (!gameId) {
        res.status(400).json({
          success: false,
          message: 'Game ID is required',
          code: 'MISSING_GAME_ID'
        });
        return;
      }

      // Validate pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          success: false,
          message: 'Invalid page number',
          code: 'INVALID_PAGE'
        });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit (must be between 1 and 100)',
          code: 'INVALID_LIMIT'
        });
        return;
      }

      // Validate sort parameters
      const validSortBy = ['createdAt', 'likes', 'comments'];
      const validSortOrder = ['asc', 'desc'];

      if (!validSortBy.includes(sortBy as string)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sortBy parameter',
          code: 'INVALID_SORT_BY'
        });
        return;
      }

      if (!validSortOrder.includes(sortOrder as string)) {
        res.status(400).json({
          success: false,
          message: 'Invalid sortOrder parameter',
          code: 'INVALID_SORT_ORDER'
        });
        return;
      }

      // Check if game exists
      const game = await gameService.getGameById(gameId);
      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Game not found',
          code: 'GAME_NOT_FOUND'
        });
        return;
      }

      const userId = (req as any).user?.id;

      const options = {
        page: pageNum,
        limit: limitNum,
        sortBy: sortBy as 'createdAt' | 'likes' | 'comments',
        sortOrder: sortOrder as 'asc' | 'desc',
        userId
      };

      const result = await gameService.getPostsByGame(gameId, options);

      res.json({
        success: true,
        message: 'Posts retrieved successfully',
        data: {
          ...result,
          game: {
            id: game.id,
            name: game.name,
            slug: game.slug,
            icon: game.icon,
            category: game.category
          }
        }
      });
    } catch (error) {
      console.error('Error getting posts by game:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Search games
   */
  async searchGames(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit = '10' } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long',
          code: 'INVALID_QUERY'
        });
        return;
      }

      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit (must be between 1 and 50)',
          code: 'INVALID_LIMIT'
        });
        return;
      }

      const games = await gameService.searchGames(q.trim(), limitNum);

      res.json({
        success: true,
        message: 'Games search completed successfully',
        data: games
      });
    } catch (error) {
      console.error('Error searching games:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get popular games
   */
  async getPopularGames(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '10' } = req.query;

      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit (must be between 1 and 50)',
          code: 'INVALID_LIMIT'
        });
        return;
      }

      const games = await gameService.getPopularGames(limitNum);

      res.json({
        success: true,
        message: 'Popular games retrieved successfully',
        data: games
      });
    } catch (error) {
      console.error('Error getting popular games:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

export const gameController = new GameController();