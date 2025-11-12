import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { storyService } from '../services/story.service';

export class StoryController {
  // Create a new story
  async createStory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { media, mediaType, caption } = req.body;

      if (!media || !mediaType) {
        res.status(400).json({
          success: false,
          message: 'Media and media type are required',
        });
        return;
      }

      const result = await storyService.createStory(userId, {
        media,
        mediaType,
        caption,
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error creating story:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create story',
      });
    }
  }

  // Get active stories
  async getStories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await storyService.getActiveStories(userId);

      res.json(result);
    } catch (error) {
      console.error('Error fetching stories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stories',
      });
    }
  }

  // View a story
  async viewStory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { storyId } = req.params;

      const result = await storyService.viewStory(storyId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error viewing story:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to view story',
      });
    }
  }

  // Delete a story
  async deleteStory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { storyId } = req.params;

      const result = await storyService.deleteStory(storyId, userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete story',
      });
    }
  }

  // Get story viewers
  async getViewers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { storyId } = req.params;

      const result = await storyService.getStoryViewers(storyId, userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error fetching viewers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch viewers',
      });
    }
  }
}

export const storyController = new StoryController();
