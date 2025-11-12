import { prisma } from '../config/database';

export interface CreateStoryPayload {
  media: string;
  mediaType: 'image' | 'video';
  caption?: string;
}

export class StoryService {
  // Create a new story
  async createStory(userId: string, payload: CreateStoryPayload) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

      const story = await prisma.story.create({
        data: {
          userId,
          media: payload.media,
          mediaType: payload.mediaType,
          caption: payload.caption,
          expiresAt,
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
        },
      });

      return { success: true, story };
    } catch (error) {
      console.error('Error creating story:', error);
      return { success: false, message: 'Failed to create story' };
    }
  }

  // Get all active stories (not expired)
  async getActiveStories(currentUserId: string) {
    try {
      const now = new Date();

      // Get stories from users that current user follows + own stories
      const stories = await prisma.story.findMany({
        where: {
          expiresAt: { gt: now },
          OR: [
            { userId: currentUserId }, // Own stories
            {
              user: {
                followers: {
                  some: {
                    followerId: currentUserId,
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
          viewers: {
            where: {
              userId: currentUserId,
            },
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              viewers: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Group stories by user
      const groupedStories = stories.reduce((acc: any, story) => {
        const userId = story.user.id;
        if (!acc[userId]) {
          acc[userId] = {
            user: story.user,
            stories: [],
            hasUnviewed: false,
          };
        }
        const viewed = story.viewers.length > 0;
        acc[userId].stories.push({
          ...story,
          viewed,
        });
        if (!viewed) {
          acc[userId].hasUnviewed = true;
        }
        return acc;
      }, {});

      return {
        success: true,
        data: Object.values(groupedStories),
      };
    } catch (error) {
      console.error('Error fetching stories:', error);
      return { success: false, message: 'Failed to fetch stories' };
    }
  }

  // View a story
  async viewStory(storyId: string, userId: string) {
    try {
      // Check if already viewed
      const existingView = await prisma.storyView.findUnique({
        where: {
          storyId_userId: {
            storyId,
            userId,
          },
        },
      });

      if (existingView) {
        return { success: true, message: 'Already viewed' };
      }

      // Create view and increment view count
      await prisma.$transaction([
        prisma.storyView.create({
          data: {
            storyId,
            userId,
          },
        }),
        prisma.story.update({
          where: { id: storyId },
          data: {
            views: { increment: 1 },
          },
        }),
      ]);

      return { success: true, message: 'Story viewed' };
    } catch (error) {
      console.error('Error viewing story:', error);
      return { success: false, message: 'Failed to view story' };
    }
  }

  // Delete a story
  async deleteStory(storyId: string, userId: string) {
    try {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
      });

      if (!story) {
        return { success: false, message: 'Story not found' };
      }

      if (story.userId !== userId) {
        return { success: false, message: 'Unauthorized' };
      }

      await prisma.story.delete({
        where: { id: storyId },
      });

      return { success: true, message: 'Story deleted' };
    } catch (error) {
      console.error('Error deleting story:', error);
      return { success: false, message: 'Failed to delete story' };
    }
  }

  // Clean up expired stories (run as cron job)
  async cleanupExpiredStories() {
    try {
      const now = new Date();
      const result = await prisma.story.deleteMany({
        where: {
          expiresAt: { lte: now },
        },
      });

      console.log(`Cleaned up ${result.count} expired stories`);
      return { success: true, count: result.count };
    } catch (error) {
      console.error('Error cleaning up stories:', error);
      return { success: false, message: 'Failed to cleanup stories' };
    }
  }

  // Get story viewers
  async getStoryViewers(storyId: string, userId: string) {
    try {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
      });

      if (!story) {
        return { success: false, message: 'Story not found' };
      }

      if (story.userId !== userId) {
        return { success: false, message: 'Unauthorized' };
      }

      const viewers = await prisma.storyView.findMany({
        where: { storyId },
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
        },
        orderBy: {
          viewedAt: 'desc',
        },
      });

      return { success: true, viewers };
    } catch (error) {
      console.error('Error fetching story viewers:', error);
      return { success: false, message: 'Failed to fetch viewers' };
    }
  }
}

export const storyService = new StoryService();
