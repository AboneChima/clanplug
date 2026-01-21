import { prisma } from '../config/database';
import config from '../config/config';
import { User, KYCStatus } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { kycService, KYCVerificationRequest } from './kyc.service';

// Configure Cloudinary if credentials are provided
if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type KYCSubmissionPayload = {
  documentType: 'NIN' | 'BVN' | 'PASSPORT' | 'DRIVERS_LICENSE';
  documentNumber: string;
  documentImages?: string[]; // URLs or Base64 strings (assumed pre-uploaded for simplicity)
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO string
  address?: string;
  phoneNumber: string;
};

export const userService = {
  async uploadAvatar(userId: string, buffer: Buffer, filename?: string): Promise<{ success: boolean; url?: string; message?: string; error?: string }> {
    try {
      if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
        return { success: false, message: 'Cloud storage is not configured', error: 'CLOUDINARY_NOT_CONFIGURED' };
      }

      const uploadResult: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          folder: 'lordmoon/avatars',
          public_id: filename ? filename.replace(/\.[^/.]+$/, '') : undefined,
          resource_type: 'image',
          overwrite: true,
        }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        stream.end(buffer);
      });

      const url = uploadResult.secure_url as string;

      await prisma.user.update({
        where: { id: userId },
        data: { avatar: url },
      });

      return { success: true, url, message: 'Avatar uploaded successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to upload avatar', error: error.message || 'UPLOAD_ERROR' };
    }
  },

  async submitKYC(userId: string, payload: KYCSubmissionPayload): Promise<{ success: boolean; message: string; kycId?: string; error?: string; status?: KYCStatus }> {
    try {
      // Basic user existence check
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, message: 'User not found', error: 'USER_NOT_FOUND' };
      }

      // Check if user already has a verified KYC
      const existingKYC = await prisma.kYCVerification.findFirst({
        where: {
          userId,
          status: KYCStatus.APPROVED,
        },
      });

      if (existingKYC) {
        return { 
          success: false, 
          message: 'User already has verified KYC', 
          error: 'ALREADY_VERIFIED',
          status: KYCStatus.APPROVED 
        };
      }

      // Prepare KYC verification request
      const kycRequest: KYCVerificationRequest = {
        userId,
        documentType: payload.documentType,
        documentNumber: payload.documentNumber,
        firstName: payload.firstName,
        lastName: payload.lastName,
        dateOfBirth: payload.dateOfBirth,
        phoneNumber: payload.phoneNumber,
        address: payload.address,
        documentImages: payload.documentImages,
      };

      // Use the automated KYC service for verification
      const verificationResult = await kycService.verifyKYC(kycRequest);

      // Update user profile fields from KYC submission
      await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          dateOfBirth: new Date(payload.dateOfBirth),
          isKYCVerified: verificationResult.success,
          status: verificationResult.success ? 'ACTIVE' : 'PENDING_VERIFICATION',
        },
      });

      return { 
        success: verificationResult.success, 
        message: verificationResult.message, 
        kycId: verificationResult.verificationId,
        status: verificationResult.status,
        error: verificationResult.error 
      };
    } catch (error: any) {
      return { success: false, message: 'Failed to submit KYC', error: error.message || 'KYC_SUBMIT_ERROR' };
    }
  },

  async getKYCStatus(userId: string): Promise<{ success: boolean; status?: KYCStatus; data?: any; message: string }> {
    try {
      // Use the KYC service to get status
      return await kycService.getKYCStatus(userId);
    } catch (error: any) {
      return { success: false, message: 'Failed to retrieve KYC status' };
    }
  },

  async retryKYCVerification(userId: string, kycId: string): Promise<{ success: boolean; message: string; status?: KYCStatus; error?: string }> {
    try {
      // Verify that the KYC belongs to the user
      const kycRecord = await prisma.kYCVerification.findFirst({
        where: {
          id: kycId,
          userId: userId,
        },
      });

      if (!kycRecord) {
        return { success: false, message: 'KYC record not found or access denied', error: 'KYC_NOT_FOUND' };
      }

      // Use the KYC service to retry verification
      const result = await kycService.retryKYCVerification(kycId);

      // Update user status if verification succeeded
      if (result.success) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            isKYCVerified: true,
            status: 'ACTIVE',
          },
        });
      }

      return {
        success: result.success,
        message: result.message,
        status: result.status,
        error: result.error,
      };
    } catch (error: any) {
      return { success: false, message: 'Failed to retry KYC verification', error: error.message || 'RETRY_ERROR' };
    }
  },

  async followUser(followerId: string, followingId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      if (followerId === followingId) {
        return { success: false, message: 'You cannot follow yourself', error: 'INVALID_OPERATION' };
      }

      // Ensure the target user exists
      const target = await prisma.user.findUnique({ where: { id: followingId } });
      if (!target) {
        return { success: false, message: 'Target user not found', error: 'USER_NOT_FOUND' };
      }

      // Check if already followed
      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
      });
      if (existing) {
        return { success: false, message: 'Already following this user', error: 'ALREADY_FOLLOWING' };
      }

      await prisma.follow.create({
        data: { followerId, followingId },
      });

      return { success: true, message: 'Followed user successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to follow user', error: error.message || 'FOLLOW_ERROR' };
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
      return { success: true, message: 'Unfollowed user successfully' };
    } catch (error: any) {
      return { success: false, message: 'Failed to unfollow user', error: error.message || 'UNFOLLOW_ERROR' };
    }
  },

  async getFollowers(userId: string, page = 1, limit = 20): Promise<{ followers: Array<Pick<User, 'id' | 'username' | 'avatar'>>; pagination: any }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        include: { follower: { select: { id: true, username: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      followers: items.map((f) => f.follower),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getFollowing(userId: string, page = 1, limit = 20): Promise<{ following: Array<Pick<User, 'id' | 'username' | 'avatar'>>; pagination: any }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        include: { following: { select: { id: true, username: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      following: items.map((f) => f.following),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async searchUsers(query: string, page = 1, limit = 20): Promise<{ users: Array<Pick<User, 'id' | 'username' | 'avatar' | 'firstName' | 'lastName'>>; pagination: any }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        select: { 
          id: true, 
          username: true, 
          avatar: true, 
          firstName: true, 
          lastName: true,
          verificationBadge: {
            select: {
              status: true,
              expiresAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getUserPublicById(userId: string, currentUserId?: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        username: true, 
        firstName: true, 
        lastName: true, 
        avatar: true, 
        bio: true,
        city: true,
        state: true,
        country: true,
        createdAt: true,
        status: true,
        isKYCVerified: true,
        verificationBadge: {
          select: {
            status: true,
            expiresAt: true,
          },
        },
      },
    });
    if (!user) throw new Error('User not found');
    
    // Check follow status if currentUserId is provided
    let isFollowing = false;
    let isFollowingBack = false;
    
    if (currentUserId && currentUserId !== userId) {
      // Check if current user is following this user
      const followingCheck = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userId,
          },
        },
      });
      isFollowing = !!followingCheck;
      
      // Check if this user is following current user back
      const followerCheck = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: currentUserId,
          },
        },
      });
      isFollowingBack = !!followerCheck;
    }
    
    return {
      ...user,
      isFollowing,
      isFollowingBack,
    };
  },

  async updateUserProfile(userId: string, data: Partial<Pick<User, 'firstName' | 'lastName' | 'bio' | 'city' | 'state' | 'country' | 'avatar' | 'username' | 'email'>>): Promise<{ success: boolean; message?: string; user?: any; error?: string }> {
    try {
      // Get current user data
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { verificationBadge: true },
      });

      if (!currentUser) {
        return { success: false, message: 'User not found', error: 'USER_NOT_FOUND' };
      }

      // Check username change restriction (30 days)
      if (data.username && data.username !== currentUser.username) {
        if (currentUser.usernameChangedAt) {
          const daysSinceLastChange = Math.floor(
            (Date.now() - currentUser.usernameChangedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastChange < 30) {
            const daysRemaining = 30 - daysSinceLastChange;
            return {
              success: false,
              message: `You can change your username again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
              error: 'USERNAME_CHANGE_COOLDOWN'
            };
          }
        }

        // Check if username is already taken
        const existingUser = await prisma.user.findUnique({
          where: { username: data.username }
        });

        if (existingUser) {
          return {
            success: false,
            message: 'Username is already taken',
            error: 'USERNAME_TAKEN'
          };
        }

        // Update usernameChangedAt timestamp
        (data as any).usernameChangedAt = new Date();
      }

      // Check email change restriction (30 days)
      if (data.email && data.email !== currentUser.email) {
        if (currentUser.emailChangedAt) {
          const daysSinceLastChange = Math.floor(
            (Date.now() - currentUser.emailChangedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastChange < 30) {
            const daysRemaining = 30 - daysSinceLastChange;
            return {
              success: false,
              message: `You can change your email again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
              error: 'EMAIL_CHANGE_COOLDOWN'
            };
          }
        }

        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email }
        });

        if (existingUser) {
          return {
            success: false,
            message: 'Email is already taken',
            error: 'EMAIL_TAKEN'
          };
        }

        // Update emailChangedAt timestamp and reset email verification
        (data as any).emailChangedAt = new Date();
        (data as any).isEmailVerified = false;
      }

      // Check if user is trying to update name
      if (data.firstName || data.lastName) {
        const isCurrentUserVerified = currentUser?.verificationBadge?.status === 'verified' && 
          currentUser.verificationBadge.expiresAt && 
          new Date() < currentUser.verificationBadge.expiresAt;

        // Check if another verified user has this exact name
        const fullName = `${data.firstName || currentUser?.firstName || ''} ${data.lastName || currentUser?.lastName || ''}`.trim();
        
        if (fullName) {
          const existingVerifiedUser = await prisma.user.findFirst({
            where: {
              id: { not: userId },
              firstName: data.firstName || currentUser?.firstName,
              lastName: data.lastName || currentUser?.lastName,
              verificationBadge: {
                status: 'verified',
                expiresAt: { gt: new Date() },
              },
            },
          });

          if (existingVerifiedUser) {
            return { 
              success: false, 
              message: 'This name is protected by a verified user. Please choose a different name.', 
              error: 'NAME_PROTECTED' 
            };
          }

          // If current user is verified, check if any other user (verified or not) has this name
          if (isCurrentUserVerified) {
            const anyUserWithName = await prisma.user.findFirst({
              where: {
                id: { not: userId },
                firstName: data.firstName || currentUser?.firstName,
                lastName: data.lastName || currentUser?.lastName,
              },
            });

            if (anyUserWithName) {
              // Force the other user to change their name by appending a number
              const randomSuffix = Math.floor(Math.random() * 9999);
              await prisma.user.update({
                where: { id: anyUserWithName.id },
                data: {
                  firstName: `${anyUserWithName.firstName}${randomSuffix}`,
                },
              });
            }
          }
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          city: true,
          state: true,
          country: true,
          isKYCVerified: true,
          isEmailVerified: true,
          usernameChangedAt: true,
          emailChangedAt: true,
        },
      });
      return { success: true, message: 'Profile updated successfully', user };
    } catch (error: any) {
      return { success: false, message: 'Failed to update profile', error: error.message || 'UPDATE_ERROR' };
    }
  },

  async getSuggestedUsers(userId: string, limit: number = 10): Promise<any[]> {
    try {
      // Get users that the current user is not following
      const users = await prisma.user.findMany({
        where: {
          id: { not: userId },
          NOT: {
            followers: {
              some: {
                followerId: userId
              }
            }
          }
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return users.map(user => ({
        ...user,
        isFollowing: false
      }));
    } catch (error) {
      console.error('Error getting suggested users:', error);
      return [];
    }
  },
};

export default userService;