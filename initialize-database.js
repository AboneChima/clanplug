const { execSync } = require('child_process');
const fs = require('fs');

const FLAG_FILE = '.db-initialized';

console.log('🔍 Checking database initialization status...\n');

// Check if already initialized
if (fs.existsSync(FLAG_FILE)) {
  console.log('✅ Database already initialized. Skipping setup.\n');
  process.exit(0);
}

console.log('🚀 First-time database initialization...\n');

try {
  console.log('1️⃣ Running Prisma migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('\n2️⃣ Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Create flag file to prevent re-running
  fs.writeFileSync(FLAG_FILE, new Date().toISOString());
  
  console.log('\n✅ Database initialized successfully!');
  console.log('This setup will not run again unless you delete .db-initialized file\n');
  
} catch (error) {
  console.error('❌ Initialization failed:', error.message);
  process.exit(1);
}
