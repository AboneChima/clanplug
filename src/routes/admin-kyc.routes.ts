import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// TEMPORARY: Activate KYC for specific user
// DELETE THIS AFTER USE!
router.post('/activate-kyc-temp', async (req: Request, res: Response) => {
  try {
    const { email, secret } = req.body;

    // Simple security check
    if (secret !== 'activate-kyc-2024') {
      return res.status(403).json({ success: false, message: 'Invalid secret' });
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { email: { contains: email, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found',
        searchedFor: email
      });
    }

    // Activate KYC
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isKYCVerified: true,
        status: 'ACTIVE'
      }
    });

    return res.json({
      success: true,
      message: 'KYC activated successfully!',
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        isKYCVerified: updated.isKYCVerified,
        status: updated.status
      }
    });

  } catch (error: any) {
    console.error('Error activating KYC:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to activate KYC',
      error: error.message
    });
  }
});

// GET endpoint for easy browser access
router.get('/verify-jobica', async (req: Request, res: Response) => {
  try {
    const { secret } = req.query;

    // Simple security check
    if (secret !== 'activate-kyc-2024') {
      return res.status(403).json({ success: false, message: 'Invalid secret' });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'jobicafoods@gmail.com' },
          { username: 'Jobica' },
          { username: { contains: 'jobica', mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Searched for: jobicafoods@gmail.com or username Jobica'
      });
    }

    // Check if already verified
    if (user.isKYCVerified) {
      return res.json({
        success: true,
        message: 'User already verified!',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isKYCVerified: user.isKYCVerified,
          status: user.status
        }
      });
    }

    // Activate KYC
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        isKYCVerified: true,
        status: 'ACTIVE'
      }
    });

    return res.json({
      success: true,
      message: '✅ KYC ACTIVATED for @Jobica!',
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        isKYCVerified: updated.isKYCVerified,
        status: updated.status
      }
    });

  } catch (error: any) {
    console.error('Error activating KYC:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to activate KYC',
      error: error.message
    });
  }
});

export default router;
