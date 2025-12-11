import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Secret key for admin operations
const ADMIN_SECRET = 'clanplug-admin-2024';

// POST /api/admin-verify/make-admin
// Make a user an admin
router.post('/make-admin', async (req: Request, res: Response) => {
  try {
    const { email, secret } = req.body;
    
    if (!email || !secret) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and secret are required' 
      });
    }
    
    if (secret !== ADMIN_SECRET) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid secret key' 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (user.role === 'ADMIN') {
      return res.json({ 
        success: true, 
        message: 'User is already an admin',
        data: { 
          email: user.email, 
          username: user.username,
          role: user.role 
        }
      });
    }
    
    const updatedUser = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        role: 'ADMIN',
        isEmailVerified: true,
        status: 'ACTIVE'
      }
    });
    
    return res.json({ 
      success: true, 
      message: 'User upgraded to admin successfully',
      data: { 
        email: updatedUser.email, 
        username: updatedUser.username,
        role: updatedUser.role 
      }
    });
    
  } catch (error: any) {
    console.error('Make admin error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Temporary endpoint to verify specific user - DELETE AFTER USE
router.post('/verify-abone', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'abonejoseph@gmail.com' }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const badge = await prisma.verificationBadge.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: 'active',
        purchasedAt: new Date(),
        expiresAt
      },
      update: {
        status: 'active',
        purchasedAt: new Date(),
        expiresAt
      }
    });
    
    return res.json({ 
      success: true, 
      message: 'User verified',
      data: { email: user.email, expiresAt: badge.expiresAt }
    });
    
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
