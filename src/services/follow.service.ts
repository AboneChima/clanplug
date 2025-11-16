import { prisma } from '../config/database';
import { notificationService } from './notification.service';

export class FollowService {
  // Follow a user
  async followUser(followerId: string, followingId: string) {
    try {
      if (followerId === followingId) {
        return { success: false, message: 'Cannot follow yourself' };
      }

      // Check if already following
      const existing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existing) {
        return { success: false, message: 'Already following this user' };
      }

      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // Create notification
      const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: { username: true, firstName: true, lastName: true },
      });

      if (follower) {
        await notificationService.createNotification({
          userId: followingId,
          type: 'SYSTEM',
          title: 'New Follower',
          message: `${follower.firstName} ${follower.lastName} (@${follower.username}) started following you`,
          data: { followerId },
        });
      }

      // Check if they're now mutual followers (friends)
      const mutualFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: followingId,
            followingId: followerId,
          },
        },
      });

      // If mutual followers, auto-create a chat if it doesn't exist
      if (mutualFollow) {
        try {
          // Check if chat already exists
          const existingChat = await prisma.chat.findFirst({
            where: {
              type: 'DIRECT',
              AND: [
                { participants: { some: { userId: followerId } } },
                { participants: { some: { userId: followingId } } },
              ],
            },
          });

          if (!existingChat) {
            // Create chat for mutual followers
            await prisma.chat.create({
              data: {
                type: 'DIRECT',
                participants: {
                  create: [
                    { userId: followerId },
                    { userId: followingId },
                  ],
                },
              },
            });
            console.log(`✅ Auto-created chat for mutual followers: ${followerId} & ${followingId}`);
          }
        } catch (chatError) {
          console.error('⚠️ Failed to auto-create chat for mutual followers:', chatError);
          // Don't fail the follow operation if chat creation fails
        }
      }

      return { success: true, message: 'Successfully followed user' };
    } catch (error) {
      console.error('Error following user:', error);
      return { success: false, message: 'Failed to follow user' };
    }
  }

  // Unfollow a user
  async unfollowUser(followerId: string, followingId: string) {
    try {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (!follow) {
        return { success: false, message: 'Not following this user' };
      }

      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return { success: true, message: 'Successfully unfollowed user' };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return { success: false, message: 'Failed to unfollow user' };
    }
  }

  // Get followers of a user
  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [followers, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followingId: userId },
          include: {
            follower: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                _count: {
                  select: {
                    followers: true,
                    follows: true,
                  },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.follow.count({
          where: { followingId: userId },
        }),
      ]);

      return {
        success: true,
        data: followers.map(f => f.follower),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching followers:', error);
      return { success: false, message: 'Failed to fetch followers' };
    }
  }

  // Get users that a user is following
  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [following, total] = await Promise.all([
        prisma.follow.findMany({
          where: { followerId: userId },
          include: {
            following: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                _count: {
                  select: {
                    followers: true,
                    follows: true,
                  },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.follow.count({
          where: { followerId: userId },
        }),
      ]);

      // Check which users are friends (mutual following)
      const followingWithFriendStatus = await Promise.all(
        following.map(async (f) => {
          const isFriend = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: f.followingId,
                followingId: userId,
              },
            },
          });
          return {
            ...f.following,
            isFriend: !!isFriend,
          };
        })
      );

      return {
        success: true,
        data: followingWithFriendStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching following:', error);
      return { success: false, message: 'Failed to fetch following' };
    }
  }

  // Check if user is following another user
  async isFollowing(followerId: string, followingId: string) {
    try {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      return { success: true, isFollowing: !!follow };
    } catch (error) {
      console.error('Error checking follow status:', error);
      return { success: false, isFollowing: false };
    }
  }

  // Check if two users are friends (mutual following)
  async areFriends(userId1: string, userId2: string) {
    try {
      const [follow1, follow2] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId1,
              followingId: userId2,
            },
          },
        }),
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId2,
              followingId: userId1,
            },
          },
        }),
      ]);

      return { success: true, areFriends: !!(follow1 && follow2) };
    } catch (error) {
      console.error('Error checking friend status:', error);
      return { success: false, areFriends: false };
    }
  }

  // Get suggested users to follow
  async getSuggestedUsers(userId: string, limit: number = 10) {
    try {
      // Get users that current user is not following
      // Prioritize users with most followers
      const suggestedUsers = await prisma.user.findMany({
        where: {
          id: { not: userId },
          status: 'ACTIVE',
          NOT: {
            followers: {
              some: {
                followerId: userId,
              },
            },
          },
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              posts: true,
            },
          },
        },
        orderBy: {
          followers: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return { success: true, data: suggestedUsers };
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      return { success: false, message: 'Failed to fetch suggested users' };
    }
  }

  // Get follow stats for a user
  async getFollowStats(userId: string) {
    try {
      const [followersCount, followingCount] = await Promise.all([
        prisma.follow.count({ where: { followingId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
      ]);

      return {
        success: true,
        data: {
          followers: followersCount,
          following: followingCount,
        },
      };
    } catch (error) {
      console.error('Error fetching follow stats:', error);
      return { success: false, message: 'Failed to fetch stats' };
    }
  }
}

export const followService = new FollowService();
