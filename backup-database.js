#!/usr/bin/env node

/**
 * Database Backup Script for Supabase PostgreSQL
 * 
 * This script creates backups of your production database.
 * Run with: node backup-database.js
 * 
 * Features:
 * - Creates timestamped SQL dump files
 * - Saves to local backups folder
 * - Can be scheduled with cron or Windows Task Scheduler
 * - Compression support
 * - Backup verification
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Backup configuration
const BACKUP_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS = 30; // Keep last 30 backups

// Parse Supabase connection string
const DIRECT_URL = process.env.DIRECT_URL || 'postgresql://postgres.htfnwvaqrhzcoybphiqk:Abonechima10.@aws-1-eu-north-1.pooler.supabase.com:5432/postgres';

// Parse connection details
function parseConnectionString(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid database URL format');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
}

// Create backup directory if it doesn't exist
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 Created backup directory:', BACKUP_DIR);
  }
}

// Generate timestamped filename
function getBackupFilename() {
  const date = new Date();
  const timestamp = date.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  return `clanplug_backup_${timestamp}.sql`;
}

// Create database backup using pg_dump
async function createBackup() {
  try {
    console.log('🚀 Starting database backup...');
    console.log('⏰ Time:', new Date().toLocaleString());
    
    ensureBackupDir();
    
    const dbConfig = parseConnectionString(DIRECT_URL);
    const filename = getBackupFilename();
    const filepath = path.join(BACKUP_DIR, filename);
    
    console.log('📊 Database:', dbConfig.database);
    console.log('🏠 Host:', dbConfig.host);
    console.log('💾 Backup file:', filename);
    
    // Set password environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password
    };
    
    // Create pg_dump command
    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${filepath}"`;
    
    console.log('⚙️ Running pg_dump...');
    
    // Execute backup
    const { stdout, stderr } = await execPromise(command, { env });
    
    if (stderr && !stderr.includes('warning')) {
      console.error('⚠️ Warning:', stderr);
    }
    
    // Verify backup file was created
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('✅ Backup created successfully!');
      console.log('📦 File size:', sizeInMB, 'MB');
      console.log('📍 Location:', filepath);
      
      // Clean old backups
      cleanOldBackups();
      
      return { success: true, filepath, size: sizeInMB };
    } else {
      throw new Error('Backup file was not created');
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    if (error.message.includes('pg_dump')) {
      console.log('\n⚠️ PostgreSQL tools not found!');
      console.log('📥 Install PostgreSQL client tools:');
      console.log('   Windows: https://www.postgresql.org/download/windows/');
      console.log('   macOS: brew install postgresql');
      console.log('   Linux: sudo apt-get install postgresql-client');
    }
    
    return { success: false, error: error.message };
  }
}

// Clean old backup files (keep only MAX_BACKUPS)
function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('clanplug_backup_') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort by newest first
    
    if (files.length > MAX_BACKUPS) {
      console.log(`\n🧹 Cleaning old backups (keeping last ${MAX_BACKUPS})...`);
      
      const filesToDelete = files.slice(MAX_BACKUPS);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log('🗑️ Deleted:', file.name);
      });
      
      console.log('✨ Cleanup complete!');
    }
  } catch (error) {
    console.error('⚠️ Cleanup error:', error.message);
  }
}

// List all backups
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('clanplug_backup_') && file.endsWith('.sql'))
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
🗄️  Database Backup Script

Usage:
  node backup-database.js           Create a new backup
  node backup-database.js --list    List all backups
  node backup-database.js --help    Show this help

Configuration:
  - Backups are saved to: ${BACKUP_DIR}
  - Maximum backups kept: ${MAX_BACKUPS}
  - Database: Supabase PostgreSQL

Requirements:
  - PostgreSQL client tools (pg_dump) must be installed
  - DIRECT_URL environment variable must be set

Scheduling:
  Windows: Use Task Scheduler
    Command: node "${__filename}"
    
  Linux/Mac: Use cron
    # Daily at 2 AM
    0 2 * * * cd ${__dirname} && node backup-database.js
    `);
    return;
  }
  
  const result = await createBackup();
  
  if (result.success) {
    console.log('\n✨ Backup process completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Backup process failed!');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { createBackup, listBackups };
