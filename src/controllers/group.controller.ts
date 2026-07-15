import { Request, Response } from 'express';
import { groupService } from '../services/group.service';

export const groupController = {
  // Get all available groups
  async getGroups(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id; // Changed from userId to id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const groups = await groupService.getAvailableGroups(userId);
      return res.json({ success: true, data: groups });
    } catch (error) {
      console.error('Get groups error:', error);
      return res.status(500).json({ error: 'Failed to get groups' });
    }
  },

  // Join a group
  async joinGroup(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id; // Changed from userId to id
      const { chatId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await groupService.joinGroup(userId, chatId);
      return res.json(result);
    } catch (error: any) {
      console.error('Join group error:', error);
      return res.status(400).json({ error: error.message || 'Failed to join group' });
    }
  },

  // Leave a group
  async leaveGroup(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id; // Changed from userId to id
      const { chatId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await groupService.leaveGroup(userId, chatId);
      return res.json(result);
    } catch (error: any) {
      console.error('Leave group error:', error);
      return res.status(400).json({ error: error.message || 'Failed to leave group' });
    }
  },

  // Get group details
  async getGroupDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id; // Changed from userId to id
      const { chatId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const group = await groupService.getGroupDetails(chatId, userId);
      return res.json({ success: true, data: group });
    } catch (error: any) {
      console.error('Get group details error:', error);
      return res.status(400).json({ error: error.message || 'Failed to get group details' });
    }
  },

  // Get group messages
  async getGroupMessages(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id; // Changed from userId to id
      const { chatId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const messages = await groupService.getGroupMessages(chatId, userId, page, limit);
      return res.json({ success: true, data: messages });
    } catch (error: any) {
      console.error('Get group messages error:', error);
      return res.status(400).json({ error: error.message || 'Failed to get messages' });
    }
  },
};
