const { execSync } = require('child_process');

console.log('🔄 Recreating database from scratch...\n');

try {
  console.log('1️⃣ Running Prisma migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('\n✅ Database recreated successfully!');
  console.log('All tables have been created from your Prisma schema.');
  
} catch (error) {
  console.error('❌ Failed to recreate database:', error.message);
  process.exit(1);
}
