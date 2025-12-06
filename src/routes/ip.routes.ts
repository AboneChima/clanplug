import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// GET /api/ip - Get server's public IP address
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get the server's public IP
    const ipResponse = await axios.get('https://api.ipify.org?format=json');
    
    res.json({
      success: true,
      data: {
        ip: ipResponse.data.ip,
        message: 'This is your Render server IP address. Send this to ClubKonnect for whitelisting.',
      }
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Could not get IP address',
      data: {
        // Fallback: try to get from request headers
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      }
    });
  }
});

export default router;
