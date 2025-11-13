import type { VercelRequest, VercelResponse } from '@vercel/node'
import serverless from 'serverless-http'
import app from '../src/app'

// Create handler with timeout configuration
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf'],
  request(request: any) {
    // Set a reasonable timeout
    request.setTimeout(9000) // 9 seconds (leave 1s buffer for Vercel's 10s limit)
  }
})

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
  
  try {
    // Handle all other routes through Express app with timeout
    const result = await Promise.race([
      handler(req as any, res as any),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Function timeout')), 9000)
      )
    ])
    return result
  } catch (error: any) {
    console.error('Handler error:', error)
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Request timeout or server error',
        error: error.message
      })
    }
    return
  }
}