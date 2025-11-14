# Enable KYC for Production User

## User Details
- **Email**: abonejoseph@gmail.com
- **Password**: abonechima
- **Registered on**: Production (Vercel)

## To Enable KYC on Production:

### Option 1: Using Prisma Studio (Recommended)
1. Connect to your production database
2. Open Prisma Studio:
   ```bash
   npx prisma studio --browser none
   ```
3. Navigate to the `User` table
4. Find user with email `abonejoseph@gmail.com`
5. Set these fields:
   - `isKYCVerified`: `true`
   - `isEmailVerified`: `true`
6. Save changes

### Option 2: Using SQL (Direct Database Access)
Connect to your production database and run:
```sql
UPDATE "User" 
SET 
  "isKYCVerified" = true,
  "isEmailVerified" = true
WHERE email = 'abonejoseph@gmail.com';
```

### Option 3: Create an Admin Endpoint (Most Secure)
Add this to your backend:
```typescript
// src/routes/admin.routes.ts
router.post('/verify-user/:userId', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isKYCVerified: true,
      isEmailVerified: true
    }
  });
  
  res.json({ success: true, user });
});
```

## What This Enables:
- ✅ Verified badge in dashboard
- ✅ Access to KYC-restricted features
- ✅ Email verified status
- ✅ Full platform access

## Current Production URL:
https://web-2vh8vnusc-oracles-projects-0d30db20.vercel.app
