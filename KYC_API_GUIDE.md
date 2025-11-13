# KYC API Integration Guide

## Overview
We've implemented a complete KYC (Know Your Customer) verification system. Users can submit their identity documents, and admins can review and approve/reject them.

## Where to Get KYC APIs

### Option 1: Dojah (Recommended for Nigeria) ✅
**Website**: https://dojah.io
**Pricing**: Pay-as-you-go, ~₦50-100 per verification
**Features**:
- NIN verification
- BVN verification
- Driver's License
- Voter's Card
- Passport verification
- Phone number verification

**How to Get**:
1. Sign up at https://dojah.io
2. Complete your business KYC
3. Get API keys from dashboard
4. Add to `.env`:
```env
DOJAH_API_KEY=your_api_key
DOJAH_APP_ID=your_app_id
DOJAH_BASE_URL=https://api.dojah.io
```

### Option 2: IdentityPass
**Website**: https://myidentitypass.com
**Pricing**: Similar to Dojah
**Features**:
- Similar verification services
- Good for West Africa

**How to Get**:
1. Sign up at https://myidentitypass.com
2. Get API credentials
3. Add to `.env`:
```env
IDENTITYPASS_API_KEY=your_api_key
IDENTITYPASS_BASE_URL=https://api.myidentitypass.com
```

### Option 3: Manual Review (Current Implementation) ✅
**Cost**: FREE
**How it works**:
- Users upload documents
- Admin reviews manually
- Approve/reject through admin panel

This is what we've implemented! No external API needed to start.

## Current Implementation

### User Flow:
1. User goes to `/kyc` page
2. Fills out personal information
3. Uploads ID documents (front, back, selfie)
4. Submits for review
5. Admin reviews and approves/rejects
6. User gets verified status

### API Endpoints:

#### Submit KYC
```
POST /api/kyc/submit
Authorization: Bearer {token}

Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "address": "123 Main St",
  "city": "Lagos",
  "state": "Lagos",
  "country": "Nigeria",
  "idType": "nin",
  "idNumber": "12345678901",
  "bvn": "22334455667",
  "idFrontUrl": "https://cloudinary.com/...",
  "idBackUrl": "https://cloudinary.com/...",
  "selfieUrl": "https://cloudinary.com/..."
}
```

#### Get KYC Status
```
GET /api/kyc/status
Authorization: Bearer {token}
```

#### Admin: List Submissions
```
GET /api/kyc/admin/list?status=PENDING
Authorization: Bearer {admin_token}
```

#### Admin: Review KYC
```
PUT /api/kyc/admin/review/{id}
Authorization: Bearer {admin_token}

Body:
{
  "status": "APPROVED",
  "rejectionReason": "Optional reason if rejected"
}
```

## Recommendation

**Start with Manual Review** (already implemented):
- No cost
- Full control
- Works immediately
- Can add automated verification later

**Add Automated Verification Later** when you have:
- More users
- Budget for API costs
- Need for instant verification

## Next Steps

1. ✅ KYC page created
2. ✅ Backend API ready
3. ✅ Cloudinary upload integrated
4. 🔄 Test the flow
5. 🔄 Create admin review page
6. 🔄 (Optional) Integrate Dojah/IdentityPass for auto-verification

## Cost Comparison

**Manual Review**:
- Cost: FREE
- Time: 24-48 hours
- Accuracy: High (human review)

**Automated (Dojah)**:
- Cost: ₦50-100 per verification
- Time: Instant
- Accuracy: Very high (government database)

For starting out, manual review is perfect!
