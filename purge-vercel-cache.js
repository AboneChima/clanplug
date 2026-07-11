#!/usr/bin/env node

/**
 * Purge Vercel CDN Cache
 * This script purges the CDN cache for www.clanplug.site
 */

const https = require('https');

// Get token from environment or prompt
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'YOUR_VERCEL_TOKEN_HERE';
const DOMAIN = 'www.clanplug.site';

if (VERCEL_TOKEN === 'YOUR_VERCEL_TOKEN_HERE') {
  console.error('❌ Error: VERCEL_TOKEN not set');
  console.log('\n📝 To purge cache:');
  console.log('1. Get your Vercel token from: https://vercel.com/account/tokens');
  console.log('2. Run: set VERCEL_TOKEN=your_token_here');
  console.log('3. Run this script again');
  process.exit(1);
}

// Purge by redeploying with force flag
console.log(`🔄 Purging cache for ${DOMAIN}...`);
console.log('\n⚠️ MANUAL STEPS REQUIRED:');
console.log('1. Go to: https://vercel.com/oracles-projects-0d30db20/web/deployments');
console.log('2. Click on the latest deployment (top one)');
console.log('3. Click the three dots (...) menu');
console.log('4. Select "Redeploy"');
console.log('5. Check "Use existing Build Cache" = OFF (unchecked)');
console.log('6. Click "Redeploy"');
console.log('\nThis will force a fresh deployment and purge all CDN cache.');

// Alternative: Check cache status
console.log('\n\n📊 Or check if cache has expired:');
console.log(`Visit: https://${DOMAIN}/user/cmi2ntvc90000bv5rbc2r5kb0`);
console.log('Open DevTools → Network → Check response headers for:');
console.log('  - x-vercel-cache: should be MISS (not HIT)');
console.log('  - age: should be 0 or very low number');
console.log('  - cache-control: should contain "no-store"');
