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
  
  // For Vercel deployment, we need to handle the root path differently
  // since the Express app has proxy middleware that won't work in production
  if (req.url === '/' || req.url === '') {
    return res.status(200).json({
      message: 'Clanplug Backend API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        api: '/api/*'
      }
    })
  }
  
  // Handle all other routes through Express app
  return handler(req as any, res as any)
}