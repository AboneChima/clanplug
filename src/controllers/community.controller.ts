import { Request, Response } from 'express';
import { communityService } from '../services/community.service';

export const communityController = {
  // GET /api/communities/discover - Get all communities for discovery
  async getDiscoverCommunities(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const communities = await communityService.getDiscoverCommunities(userId);
      return res.json({ success: true, data: communities });
    } catch (error) {
      console.error('Get discover communities error:', error);
      return res.status(500).json({ error: 'Failed to get communities' });
    }
  },

  // GET /api/communities/my-communities - Get user's joined communities
  async getMyCommunities(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const communities = await communityService.getMyCommunitiesAsync(userId);
      return res.json({ success: true, data: communities });
    } catch (error) {
      console.error('Get my communities error:', error);
      return res.status(500).json({ error: 'Failed to get communities' });
    }
  },

  // GET /api/communities/:id - Get community details
  async getCommunityDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const community = await communityService.getCommunityDetails(id, userId);
      return res.json({ success: true, data: community });
    } catch (error: any) {
      console.error('Get community details error:', error);
      return res.status(400).json({ error: error.message || 'Failed to get community details' });
    }
  },

  // POST /api/communities/:id/join - Join a community
  async joinCommunity(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await communityService.joinCommunity(userId, id);
      return res.json(result);
    } catch (error: any) {
      console.error('Join community error:', error);
      return res.status(400).json({ error: error.message || 'Failed to join community' });
    }
  },

  // POST /api/communities/:id/leave - Leave a community
  async leaveCommunity(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await communityService.leaveCommunity(userId, id);
      return res.json(result);
    } catch (error: any) {
      console.error('Leave community error:', error);
      return res.status(400).json({ error: error.message || 'Failed to leave community' });
    }
  },

  // GET /api/communities/:id/messages - Get community messages
  async getCommunityMessages(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const messages = await communityService.getCommunityMessages(id, userId, page, limit);
      return res.json({ success: true, data: messages });
    } catch (error: any) {
      console.error('Get community messages error:', error);
      return res.status(400).json({ error: error.message || 'Failed to get messages' });
    }
  },

  // POST /api/communities/:id/messages - Send a community message
  async sendCommunityMessage(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      const { content, type, attachments, replyToId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const message = await communityService.sendCommunityMessage(
        id,
        userId,
        content,
        type || 'TEXT',
        attachments,
        replyToId
      );

      // Broadcast via Socket.IO
      try {
        const { emitToCommunity } = require('../socket/socket');
        emitToCommunity(id, 'community:message:new', message);
      } catch (error) {
        console.warn('Socket.IO not available:', error);
      }

      return res.status(201).json({ success: true, data: message });
    } catch (error: any) {
      console.error('Send community message error:', error);
      return res.status(400).json({ error: error.message || 'Failed to send message' });
    }
  },

  // PUT /api/communities/:id/read - Mark community as read
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await communityService.markCommunityAsRead(id, userId);
      return res.json({ success: true });
    } catch (error: any) {
      console.error('Mark as read error:', error);
      return res.status(400).json({ error: error.message || 'Failed to mark as read' });
    }
  },
};
