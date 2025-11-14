const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function activateKYC() {
  const backendUrl = 'https://clanplug-o7rp.onrender.com';
  const email = 'abonejoseph@gmail.com';
  const password = 'abonechima';
  
  console.log('🔐 Logging in as admin...');
  
  try {
    // Login as the user first
    const loginResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed. User may not exist yet.');
      console.log('Please sign up at: https://web-pw1tubg9c-oracles-projects-0d30db20.vercel.app');
      return;
    }
    
    const loginData = await loginResponse.json();
    const userId = loginData.user?.id;
    const token = loginData.tokens?.accessToken;
    
    console.log('✅ Logged in successfully');
    console.log('User ID:', userId);
    console.log('');
    
    // Now update the user directly via database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://postgres.htfnwvaqrhzcoybphiqk:Abonechima10.@aws-1-eu-north-1.pooler.supabase.com:5432/postgres'
        }
      }
    });
    
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isKYCVerified: true,
        isEmailVerified: true
      }
    });
    
    console.log('✅ KYC ACTIVATED!');
    console.log('');
    console.log('User:', updated.email);
    console.log('Username:', updated.username);
    console.log('KYC Verified: ✅');
    console.log('Email Verified: ✅');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

activateKYC();
