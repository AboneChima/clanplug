import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/health - Health check with version info
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.1-metadata-support',
    features: {
      chatMetadata: true,
      prismaGenerated: true,
    },
  });
});

export default router;
