import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Admin key middleware
const adminAuth = (req: Request, res: Response, next: any): void => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  
  if (adminKey !== process.env.ADMIN_ACCESS_KEY) {
    res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }
  
  next();
};

// POST /api/admin-verify-badge - Verify user with badge
router.post('/', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, years = 5 } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + years);

    // Check if badge exists
    let badge = await prisma.verificationBadge.findUnique({
      where: { userId: user.id }
    });

    if (badge) {
      // Update existing badge
      badge = await prisma.verificationBadge.update({
        where: { userId: user.id },
        data: {
          status: 'verified',
          purchasedAt: new Date(),
          expiresAt: expiresAt
        }
      });
    } else {
      // Create new badge
      badge = await prisma.verificationBadge.create({
        data: {
          userId: user.id,
          status: 'verified',
          purchasedAt: new Date(),
          expiresAt: expiresAt
        }
      });
    }

    res.json({
      success: true,
      message: `User verified for ${years} years`,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        },
        badge: {
          id: badge.id,
          status: badge.status,
          expiresAt: badge.expiresAt
        }
      }
    });
  } catch (error: any) {
    console.error('Error verifying user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify user',
      error: error.message
    });
  }
});

export default router;
