import { Request, Response } from 'express';
import { verificationService } from '../services/verification.service';

export const verificationController = {
  // Get verification status
  async getStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const status = await verificationService.getVerificationStatus(userId);
      return res.json({ success: true, data: status });
    } catch (error: any) {
      console.error('Get verification status error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Purchase verification badge
  async purchase(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await verificationService.purchaseVerification(userId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Purchase verification error:', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  // Renew verification badge
  async renew(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await verificationService.renewVerification(userId);
      return res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Renew verification error:', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },
};

  // Manual verification (admin only) - verify user by email
  async manualVerify(req: Request, res: Response) {
    try {
      const { email, secret } = req.body;
      
      // Simple secret check (you can change this)
      if (secret !== 'verify-user-2024') {
        return res.status(403).json({ success: false, message: 'Invalid secret' });
      }

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email required' });
      }

      const result = await verificationService.manualVerifyUser(email);
      return res.json({ success: true, data: result, message: 'User verified successfully' });
    } catch (error: any) {
      console.error('Manual verification error:', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },
