import { Request, Response } from 'express';
import { searchService } from '../services/search.service';

export const searchController = {
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { q, type = 'all' } = req.query;
      const userId = (req.user as any)?.id;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      if (q.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
        return;
      }

      const results = await searchService.search(q.trim(), type as string, userId);

      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error('❌ Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error: error.message
      });
    }
  }
};
