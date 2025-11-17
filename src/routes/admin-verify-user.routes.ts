import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

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
