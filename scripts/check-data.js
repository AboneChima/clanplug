#!/usr/bin/env node
/**
 * Check what data exists in the database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking database data...\n');
    
    // Check users (try both User and users)
    try {
      const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
      console.log(`👥 Users: ${userCount[0].count}`);
    } catch (e) {
      try {
        const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
        console.log(`👥 Users (lowercase): ${userCount[0].count}`);
      } catch (e2) {
        console.log(`👥 Users: Table not found`);
      }
    }
    
    // Check wallets
    try {
      const walletCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM wallets`;
      console.log(`💰 Wallets: ${walletCount[0].count}`);
    } catch (e) {
      console.log(`💰 Wallets: ${e.message}`);
    }
    
    // Check transactions
    try {
      const txCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`;
      console.log(`💸 Transactions: ${txCount[0].count}`);
    } catch (e) {
      console.log(`💸 Transactions: ${e.message}`);
    }
    
    // Check posts
    try {
      const postCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM posts`;
      console.log(`📝 Posts: ${postCount[0].count}`);
    } catch (e) {
      console.log(`📝 Posts: ${e.message}`);
    }
    
    // Check escrows
    try {
      const escrowCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM escrows`;
      console.log(`🔒 Escrows: ${escrowCount[0].count}`);
    } catch (e) {
      console.log(`🔒 Escrows: ${e.message}`);
    }
    
    // List all tables
    console.log('\n📋 All tables in database:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
