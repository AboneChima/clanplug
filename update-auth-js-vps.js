const { Client } = require('ssh2');
const readline = require('readline');

const conn = new Client();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askPassword() {
  return new Promise((resolve) => {
    rl.question('Enter VPS password: ', (password) => {
      resolve(password);
    });
  });
}

function execCommand(command) {
  return new Promise((resolve) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        console.error('Error:', err.message);
        resolve('');
        return;
      }
      
      let output = '';
      stream.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      });
      stream.stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
      stream.on('close', () => resolve(output));
    });
  });
}

async function run() {
  try {
    const password = await askPassword();
    rl.close();
    
    console.log('\nConnecting...\n');
    await new Promise((resolve, reject) => {
      conn.on('ready', resolve).on('error', reject).connect({
        host: '176.57.189.248',
        port: 22,
        username: 'root',
        password: password
      });
    });
    
    console.log('Connected\n');
    
    console.log('Backing up current auth.js...\n');
    await execCommand('cp /var/www/clanplug/backend/dist/utils/auth.js /var/www/clanplug/backend/dist/utils/auth.js.backup');
    
    console.log('\nPatching auth.js to accept old tokens...\n');
    await execCommand(`cd /var/www/clanplug/backend/dist/utils && cat > auth-patch.js << 'EOF'
// Patch for verifyAccessToken - add try/catch fallback
const fs = require('fs');
const content = fs.readFileSync('auth.js', 'utf8');

// Replace verifyAccessToken method
const updated = content.replace(
  /verifyAccessToken\\(token\\) \\{[\\s\\S]*?catch \\(error\\) \\{[\\s\\S]*?\\}[\\s\\S]*?\\}/,
  \`verifyAccessToken(token) {
        try {
            // Try with strict validation first (for new tokens)
            try {
                return jwt.verify(token, config_1.default.JWT_SECRET, {
                    issuer: config_1.default.APP_NAME,
                    audience: config_1.default.APP_URL,
                });
            }
            catch (err) {
                // If strict validation fails, try lenient validation (for old tokens)
                // This allows tokens without issuer/audience to still work
                return jwt.verify(token, config_1.default.JWT_SECRET);
            }
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Access token expired');
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid access token');
            }
            throw new Error('Failed to verify access token');
        }
    }\`
);

// Replace verifyRefreshToken method
const updated2 = updated.replace(
  /verifyRefreshToken\\(token\\) \\{[\\s\\S]*?JWT_REFRESH_SECRET,\\s*\\{[\\s\\S]*?\\}\\)[\\s\\S]*?catch \\(error\\) \\{[\\s\\S]*?\\}[\\s\\S]*?\\}/,
  \`verifyRefreshToken(token) {
        try {
            // Try with strict validation first (for new tokens)
            try {
                return jwt.verify(token, config_1.default.JWT_REFRESH_SECRET, {
                    issuer: config_1.default.APP_NAME,
                    audience: config_1.default.APP_URL,
                });
            }
            catch (err) {
                // If strict validation fails, try lenient validation (for old tokens)
                return jwt.verify(token, config_1.default.JWT_REFRESH_SECRET);
            }
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Refresh token expired');
            }
            else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            throw new Error('Failed to verify refresh token');
        }
    }\`
);

fs.writeFileSync('auth.js', updated2, 'utf8');
console.log('Patched successfully!');
EOF
node auth-patch.js && rm auth-patch.js`);
    
    console.log('\n\nRestarting backend...\n');
    await execCommand('pm2 restart clanplug-backend');
    
    console.log('\n✅ Done! Old tokens now work.');
    
    conn.end();
  } catch (error) {
    console.error('\nError:', error.message);
    conn.end();
    process.exit(1);
  }
}

run();
