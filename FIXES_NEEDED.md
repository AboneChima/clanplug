# Critical Fixes Needed

## 1. Internal Transfer Issue ❌
**Problem:** Transfer failing with "failed to send transfer please try again"
**Status:** Need to check backend wallet transfer endpoint
**Files to check:**
- `src/controllers/wallet.controller.ts`
- `src/services/wallet.service.ts`
- `src/routes/wallet.routes.ts`

## 2. Forgot Password Feature ❌
**Problem:** No password reset functionality
**What's needed:**
- Add "Forgot Password" link on login page
- Create password reset request page
- Email verification with reset token
- Password reset confirmation page
- Backend endpoints for password reset

## 3. KYC Verification Enhancement ❌
**Problem:** No actual ID verification - just document upload
**Current:** Users upload documents, admin manually reviews
**Improvement needed:** Integration with NIMC or other ID verification services

**Options:**
- **NIMC (National Identity Management Commission)** - Nigerian ID verification
- **Dojah** - Nigerian KYC/ID verification API
- **IdentityPass** - African identity verification
- **Smile Identity** - Pan-African KYC

**What it takes:**
1. API key from verification provider
2. Integration with their API
3. Automatic verification of:
   - NIN (National Identification Number)
   - BVN (Bank Verification Number)
   - Driver's License
   - Voter's Card
   - International Passport

## 4. Notification Transaction Details ❌
**Problem:** Users can't view transaction details from notifications
**What's needed:**
- Create transaction detail modal
- Show full transaction info (amount, recipient, date, status, etc.)
- Make it mobile-responsive
- Beautiful, modern UI

---

## Priority Order:
1. **Fix Internal Transfer** (Critical - users can't send money)
2. **Add Forgot Password** (Important - users get locked out)
3. **Transaction Details Modal** (Important - better UX)
4. **KYC Enhancement** (Nice to have - requires external service)

Would you like me to start fixing these in order?
