import { Router, Request, Response } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/activity - Recent activity (mock server data)
router.get('/', optionalAuthenticate, asyncHandler(async (req: Request, res: Response) => {
  const username = req.user ? req.user.email.split('@')[0] : 'guest';
  const items = [
    { id: 'act_001', type: 'LOGIN', description: `Successful login by @${username}`, createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { id: 'act_002', type: 'POST', description: 'New post published', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'act_003', type: 'WALLET', description: 'Wallet deposit processed (₦50,000)', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'act_004', type: 'CHAT', description: 'New chat message received', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  ];
  return res.json({ success: true, data: items });
}));

export default router;