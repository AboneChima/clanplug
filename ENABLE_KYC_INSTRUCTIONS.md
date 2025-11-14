# Enable KYC for User

## Steps to Enable KYC for abonejoseph@gmail.com

1. **First, register the user** at: https://web-5ez11pimp-oracles-projects-0d30db20.vercel.app
   - Use email: `abonejoseph@gmail.com`
   - Complete the registration

2. **Then run this command** to enable KYC:
   ```bash
   node enable-kyc.js
   ```

## What the script does:
- Enables `isKYCVerified = true`
- Enables `isEmailVerified = true`
- Shows the verified badge in the dashboard

## Current Users in Database:
- admin@lordmoon.local (KYC: ✅)
- john@lordmoon.local (KYC: ✅)
- jane@lordmoon.local (KYC: ✅)
- mike@lordmoon.local (KYC: ✅)
- sarah@lordmoon.local (KYC: ✅)

## To enable KYC for a different user:
Edit `enable-kyc.js` and change the email on line 7:
```javascript
where: { email: 'YOUR_EMAIL_HERE' }
```
