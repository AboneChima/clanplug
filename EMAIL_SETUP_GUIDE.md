# Email Setup Guide - Avoid Spam Folder

## Current Issue
Emails are not being delivered because of SMTP configuration issues.

## Solution 1: Fix Gmail App Password (Recommended)

### Step 1: Get Correct Gmail App Password
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → Type "Clan Plug Backend"
5. Click **Generate**
6. Copy the 16-character password (NO SPACES!)
   - Example: `abcdwxyzpqrslmno` (all lowercase, no spaces)

### Step 2: Update Environment Variables

**Local (.env):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deoraclee@gmail.com
SMTP_PASS=abcdwxyzpqrslmno  # Your 16-char app password (NO SPACES!)
SMTP_FROM=deoraclee@gmail.com  # Use same as SMTP_USER
SMTP_SECURE=false
```

**Production (Render Dashboard):**
1. Go to Render Dashboard → Your Service → Environment
2. Update these variables:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=deoraclee@gmail.com
   SMTP_PASS=your_16_char_app_password_no_spaces
   SMTP_FROM=deoraclee@gmail.com
   SMTP_SECURE=false
   ```
3. Click **Save Changes** (will auto-redeploy)

---

## Solution 2: Use Professional Email Service (Best for Production)

### Why Professional Email?
- ✅ Better deliverability (99% inbox rate)
- ✅ No spam folder issues
- ✅ Higher sending limits
- ✅ Email analytics
- ✅ Professional appearance

### Recommended Services:

#### 1. SendGrid (Best for Startups)
- **Free Tier**: 100 emails/day forever
- **Paid**: $19.95/month for 50,000 emails
- **Setup**: https://sendgrid.com

**Configuration:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@clanplug.com
SMTP_SECURE=false
```

#### 2. Mailgun (Best for Developers)
- **Free Tier**: 5,000 emails/month for 3 months
- **Paid**: $35/month for 50,000 emails
- **Setup**: https://mailgun.com

**Configuration:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.clanplug.com
SMTP_PASS=your_mailgun_password
SMTP_FROM=noreply@clanplug.com
SMTP_SECURE=false
```

#### 3. AWS SES (Cheapest for High Volume)
- **Cost**: $0.10 per 1,000 emails
- **Free Tier**: 62,000 emails/month (if using EC2)
- **Setup**: https://aws.amazon.com/ses

**Configuration:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_access_key
SMTP_PASS=your_aws_secret_key
SMTP_FROM=noreply@clanplug.com
SMTP_SECURE=false
```

#### 4. Resend (Modern & Simple)
- **Free Tier**: 3,000 emails/month
- **Paid**: $20/month for 50,000 emails
- **Setup**: https://resend.com

**Configuration:**
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
SMTP_FROM=noreply@clanplug.com
SMTP_SECURE=false
```

---

## Tips to Avoid Spam Folder

### 1. Use Professional "From" Address
❌ Bad: `deoraclee@gmail.com`
✅ Good: `noreply@clanplug.com` or `support@clanplug.com`

### 2. Set Up SPF, DKIM, DMARC Records
Add these DNS records to your domain (clanplug.com):

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

**DKIM Record:**
Get from your email provider (SendGrid, Mailgun, etc.)

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@clanplug.com
```

### 3. Warm Up Your Email Domain
- Start with low volume (10-20 emails/day)
- Gradually increase over 2-3 weeks
- Avoid sudden spikes

### 4. Email Content Best Practices
✅ Do:
- Use proper HTML structure
- Include plain text version
- Add unsubscribe link (for marketing emails)
- Use professional templates
- Personalize with user's name

❌ Don't:
- Use ALL CAPS in subject
- Use too many exclamation marks!!!
- Use spam trigger words (FREE, WIN, URGENT)
- Send from "no-reply@" for important emails

---

## Testing Email Delivery

### Test 1: Send Test Email
```bash
# From your backend
curl -X POST https://api.clanplug.site/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### Test 2: Check Email Headers
1. Receive the email
2. Click "Show Original" or "View Source"
3. Check for:
   - SPF: PASS
   - DKIM: PASS
   - DMARC: PASS

### Test 3: Use Email Testing Tools
- **Mail Tester**: https://www.mail-tester.com
- **GlockApps**: https://glockapps.com
- **Litmus**: https://litmus.com

---

## Quick Fix for Right Now

**Update your .env file:**
```env
SMTP_PASS=tivplyipbvlwqeha  # Remove spaces!
SMTP_FROM=deoraclee@gmail.com  # Use same as SMTP_USER
```

**Then restart your backend:**
```bash
# If running locally
npm run dev

# If on Render
# Just update environment variables in dashboard - auto redeploys
```

---

## Recommended Setup for Production

1. **Short Term (This Week)**:
   - Fix Gmail app password (remove spaces)
   - Update SMTP_FROM to match SMTP_USER
   - Test with your personal email

2. **Medium Term (Next Week)**:
   - Sign up for SendGrid or Resend (free tier)
   - Configure custom domain email
   - Set up SPF/DKIM records

3. **Long Term (Before Launch)**:
   - Get professional email service
   - Set up DMARC
   - Implement email analytics
   - Create email templates for all notifications

---

**Need Help?** Let me know which solution you want to implement!
