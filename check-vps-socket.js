const { Client } = require('ssh2');
require('dotenv').config();

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH connection established');
  
  // Check if dist/socket folder exists on VPS
  conn.exec('cd /var/www/clanplug/backend && ls -la dist/ | grep socket', (err, stream) => {
    if (err) {
      console.error('❌ Error checking socket folder:', err);
      conn.end();
      return;
    }
    
    let output = '';
    stream.on('data', (data) => {
      output += data.toString();
    }).on('close', (code) => {
      console.log('\n📁 Socket folder on VPS:');
      console.log(output || '❌ No socket folder found!');
      
      // Check if group routes exist
      conn.exec('cd /var/www/clanplug/backend && ls -la dist/routes/ | grep group', (err, stream) => {
        if (err) {
          console.error('❌ Error checking group routes:', err);
          conn.end();
          return;
        }
        
        let output2 = '';
        stream.on('data', (data) => {
          output2 += data.toString();
        }).on('close', (code) => {
          console.log('\n📁 Group routes on VPS:');
          console.log(output2 || '❌ No group routes found!');
          
          // Check if socket.io is in package.json
          conn.exec('cd /var/www/clanplug/backend && grep "socket.io" package.json', (err, stream) => {
            if (err) {
              console.error('❌ Error checking package.json:', err);
              conn.end();
              return;
            }
            
            let output3 = '';
            stream.on('data', (data) => {
              output3 += data.toString();
            }).on('close', (code) => {
              console.log('\n📦 Socket.io in package.json:');
              console.log(output3 || '❌ Not found!');
              
              // Check if socket.io is actually installed in node_modules
              conn.exec('cd /var/www/clanplug/backend && ls node_modules/ | grep socket.io', (err, stream) => {
                if (err) {
                  console.error('❌ Error checking node_modules:', err);
                  conn.end();
                  return;
                }
                
                let output4 = '';
                stream.on('data', (data) => {
                  output4 += data.toString();
                }).on('close', (code) => {
                  console.log('\n📦 Socket.io in node_modules:');
                  console.log(output4 || '❌ Not installed!');
                  
                  // Check PM2 logs for Socket.IO initialization
                  conn.exec('cd /var/www/clanplug/backend && pm2 logs --lines 50 --nostream', (err, stream) => {
                    if (err) {
                      console.error('❌ Error checking logs:', err);
                      conn.end();
                      return;
                    }
                    
                    let output5 = '';
                    stream.on('data', (data) => {
                      output5 += data.toString();
                    }).on('close', (code) => {
                      console.log('\n📋 PM2 Logs (last 50 lines):');
                      console.log(output5);
                      conn.end();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USER,
  password: process.env.VPS_PASSWORD
});

conn.on('error', (err) => {
  console.error('❌ SSH connection error:', err.message);
});
