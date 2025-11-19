# KYC System - Complete Overhaul Required

## Current Issues Identified:

1. ❌ No admin KYC review page
2. ❌ Users can enter fake NIN/BVN/Driver's License
3. ❌ Duplicate upload fields appearing
4. ❌ No real verification of documents
5. ❌ No notification when KYC approved/rejected
6. ❌ Admin can't review user details properly

## Required Implementation:

### Phase 1: Admin KYC Review Page (CRITICAL)
**Location:** `web/src/app/admin/kyc/page.tsx`

**Features Needed:**
- List all KYC submissions (pending, approved, rejected)
- View full user details (name, email, phone, address)
- View uploaded documents (NIN, BVN, Driver's License, Selfie)
- Approve/Reject with reason
- Add admin notes
- Send notification to user on approval/rejection
- Track approval history

### Phase 2: Fix KYC Form
**Location:** `web/src/app/kyc/page.tsx`

**Fixes Needed:**
- Remove duplicate upload fields
- Add better validation for NIN (11 digits)
- Add better validation for BVN (11 digits)
- Add better validation for Driver's License
- Show clear upload status
- Prevent submission with fake data

### Phase 3: Real Verification (Optional - Requires 3rd Party API)
**Options:**
- Integrate Smile Identity API
- Integrate Youverify API
- Integrate Dojah API

**Note:** This requires paid API keys and is optional

### Phase 4: Notification System
- Send email when KYC approved
- Send in-app notification
- Update user status in real-time
- Show KYC status on profile

## Backend Endpoints Needed:
- GET /api/admin/kyc - List all KYC submissions
- GET /api/admin/kyc/:id - Get specific KYC details
- PUT /api/admin/kyc/:id/approve - Approve KYC
- PUT /api/admin/kyc/:id/reject - Reject KYC with reason
- POST /api/kyc/submit - Submit KYC (already exists?)

## Database Schema Needed:
```prisma
model KYCSubmission {
  id String @id @default(cuid())
  userId String @unique
  user User @relation(fields: [userId], references: [id])
  
  // Personal Info
  fullName String
  dateOfBirth DateTime
  address String
  city String
  state String
  
  // ID Numbers
  nin String?
  bvn String?
  driversLicense String?
  
  // Documents
  ninDocument String?
  bvnDocument String?
  licenseDocument String?
  selfieDocument String?
  
  // Status
  status KYCStatus @default(PENDING)
  submittedAt DateTime @default(now())
  reviewedAt DateTime?
  reviewedBy String?
  
  // Admin Review
  rejectionReason String?
  adminNotes String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum KYCStatus {
  PENDING
  APPROVED
  REJECTED
  RESUBMIT_REQUIRED
}
```

## Implementation Priority:
1. **URGENT:** Create admin KYC review page
2. **HIGH:** Fix duplicate upload fields
3. **HIGH:** Add approval/rejection notifications
4. **MEDIUM:** Improve form validation
5. **LOW:** Integrate real verification API

## Next Steps:
1. Check if backend KYC endpoints exist
2. Create admin KYC review page
3. Fix KYC form issues
4. Test full flow
5. Deploy

**Estimated Time:** 2-3 hours for full implementation
**Current Status:** Planning phase
