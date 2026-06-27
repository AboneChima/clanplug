#!/usr/bin/env node

/**
 * Simple Supabase Backup Script
 * 
 * This script exports your database data using Prisma
 * No PostgreSQL tools required!
 * 
 * Run with: node backup-supabase-simple.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Use RENDER_DATABASE_URL, DIRECT_URL, or DATABASE_URL from environment
// Default to Render production database
const databaseUrl = process.env.RENDER_DATABASE_URL 
  || process.env.DIRECT_URL 
  || process.env.DATABASE_URL
  || 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon';

console.log('🔗 Connecting to database...');
console.log('🌐 Host:', databaseUrl.split('@')[1]?.split('/')[0] || 'Unknown');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 Created backup directory:', BACKUP_DIR);
  }
}

// Get timestamp for filename
function getTimestamp() {
  const date = new Date();
  return date.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
}

// Export all data from database
async function exportDatabase() {
  try {
    console.log('🚀 Starting database export...');
    console.log('⏰ Time:', new Date().toLocaleString());
    
    ensureBackupDir();
    
    const timestamp = getTimestamp();
    const filename = `clanplug_data_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    console.log('📊 Exporting data from all tables...');
    
    // Export all tables
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };
    
    // Export Users
    console.log('👥 Exporting users...');
    backup.data.users = await prisma.user.findMany({
      include: {
        verificationBadge: true,
        kycVerification: true,
        wallet: true,
        profile: true
      }
    });
    console.log(`   ✓ ${backup.data.users.length} users`);
    
    // Export Posts
    console.log('📝 Exporting posts...');
    backup.data.posts = await prisma.post.findMany({
      include: {
        likes: true,
        comments: true,
        _count: true
      }
    });
    console.log(`   ✓ ${backup.data.posts.length} posts`);
    
    // Export Marketplace Listings
    console.log('🏪 Exporting marketplace listings...');
    backup.data.marketplaceListings = await prisma.marketplaceListing.findMany({
      include: {
        seller: true
      }
    });
    console.log(`   ✓ ${backup.data.marketplaceListings.length} listings`);
    
    // Export Chats
    console.log('💬 Exporting chats...');
    backup.data.chats = await prisma.chat.findMany({
      include: {
        participants: true,
        messages: true
      }
    });
    console.log(`   ✓ ${backup.data.chats.length} chats`);
    
    // Export Transactions
    console.log('💰 Exporting transactions...');
    backup.data.transactions = await prisma.transaction.findMany();
    console.log(`   ✓ ${backup.data.transactions.length} transactions`);
    
    // Export Notifications
    console.log('🔔 Exporting notifications...');
    backup.data.notifications = await prisma.notification.findMany();
    console.log(`   ✓ ${backup.data.notifications.length} notifications`);
    
    // Export VTU Transactions
    console.log('📱 Exporting VTU transactions...');
    backup.data.vtuTransactions = await prisma.vTUTransaction.findMany();
    console.log(`   ✓ ${backup.data.vtuTransactions.length} VTU transactions`);
    
    // Write to file
    console.log('\n💾 Writing backup file...');
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));
    
    const stats = fs.statSync(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Backup created successfully!');
    console.log('📦 File size:', sizeInMB, 'MB');
    console.log('📍 Location:', filepath);
    console.log('\n📊 Backup Summary:');
    console.log(`   👥 Users: ${backup.data.users.length}`);
    console.log(`   📝 Posts: ${backup.data.posts.length}`);
    console.log(`   🏪 Listings: ${backup.data.marketplaceListings.length}`);
    console.log(`   💬 Chats: ${backup.data.chats.length}`);
    console.log(`   💰 Transactions: ${backup.data.transactions.length}`);
    console.log(`   🔔 Notifications: ${backup.data.notifications.length}`);
    console.log(`   📱 VTU Transactions: ${backup.data.vtuTransactions.length}`);
    
    return { success: true, filepath, size: sizeInMB };
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// List all backups
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('clanplug_data_') && file.endsWith('.json'))
      .map(file => {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filepath);
        return {
          name: file,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          date: stats.mtime.toLocaleString()
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (files.length === 0) {
      console.log('📭 No backups found');
      return;
    }
    
    console.log('\n📚 Available backups:\n');
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Size: ${file.size}`);
      console.log(`   Date: ${file.date}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error listing backups:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    listBackups();
    return;
  }
  
  if (args.includes('--help')) {
    console.log(`
🗄️  Simple Database Backup Script

Usage:
  node backup-supabase-simple.js           Create a new backup
  node backup-supabase-simple.js --list    List all backups
  node backup-supabase-simple.js --help    Show this help

Features:
  ✓ No PostgreSQL tools required
  ✓ Exports all data as JSON
  ✓ Includes relationships
  ✓ Easy to restore
  
Backups include:
  - Users (with profiles, wallets, KYC data)
  - Posts (with likes and comments)
  - Marketplace listings
  - Chats and messages
  - Transactions
  - Notifications
  - VTU transactions

Location: ${BACKUP_DIR}
    `);
    return;
  }
  
  const result = await exportDatabase();
  
  if (result.success) {
    console.log('\n✨ Backup completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Backup failed!');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { exportDatabase, listBackups };
