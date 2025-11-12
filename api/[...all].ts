import type { VercelRequest, VercelResponse } from '@vercel/node'
import serverless from 'serverless-http'
import app from '../src/app'

const handler = serverless(app)

export default async function(req: VercelRequest, res: VercelResponse) {
  // Add health check endpoint
  if (req.url === '/health' || req.url === '/api/health') {
    return res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'clanplug-backend'
    })
  }
  
  // Handle all other routes through Express app
  return handler(req as any, res as any)
}