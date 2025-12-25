# Verify Natashanice8717@gmail.com - Instructions

## Option 1: Using Admin Panel (Recommended)

1. Go to: https://web-egalug1nw-oracles-projects-0d30db20.vercel.app/admin-login
2. Login with admin credentials
3. Navigate to: `/admin/verifications`
4. Click "Verify User" button
5. Search for: `Natashanice8717@gmail.com`
6. Enter days: `60`
7. Click "Verify User"

## Option 2: Using Render Database Console

1. Go to Render Dashboard
2. Open your PostgreSQL database
3. Click "Connect" → "External Connection"
4. Run this SQL:

```sql
-- Verify Natashanice8717@gmail.com for 60 days

-- Insert or update verification badge
INSERT INTO verification_badges (id, "userId", status, "purchasedAt", "expiresAt", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    id,
    'verified',
    NOW(),
    NOW() + INTERVAL '60 days',
    NOW(),
    NOW()
FROM users 
WHERE LOWER(email) = 'natashanice8717@gmail.com'
ON CONFLICT ("userId") 
DO UPDATE SET
    status = 'verified',
    "purchasedAt" = NOW(),
    "expiresAt" = NOW() + INTERVAL '60 days',
    "updatedAt" = NOW();

-- Create notification
INSERT INTO notifications (id, "userId", type, title, message, "isRead", "createdAt")
SELECT 
    gen_random_uuid(),
    id,
    'SYSTEM',
    '✅ Verification Badge Activated!',
    'Congratulations! Your verification badge is now active for 60 days.',
    false,
    NOW()
FROM users 
WHERE LOWER(email) = 'natashanice8717@gmail.com';

-- Verify it worked
SELECT 
    u.username,
    u.email,
    vb.status,
    vb."expiresAt"
FROM users u
LEFT JOIN verification_badges vb ON vb."userId" = u.id
WHERE LOWER(u.email) = 'natashanice8717@gmail.com';
```

## Option 3: Using API (if you have admin token)

```bash
# 1. Login as admin
curl -X POST https://clanplug.onrender.com/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lordmoon.com","password":"YOUR_PASSWORD"}'

# 2. Get user ID
curl -X GET "https://clanplug.onrender.com/api/admin/users?search=Natashanice8717" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Verify user
curl -X POST https://clanplug.onrender.com/api/admin/verifications/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID_HERE","days":60}'
```

## Troubleshooting

If Option 1 shows 401 error:
- Clear browser cache
- Logout and login again
- Make sure you're using admin account

The easiest is Option 2 (SQL) - just copy/paste into Render's database console.
