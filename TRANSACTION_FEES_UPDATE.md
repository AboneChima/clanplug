# 🎯 Transaction Fees & Media Upload Updates

## ✅ Implemented Changes

### 1. **3% Platform Fees Added** 💰

#### Deposits (NEW)
- **Fee**: 3% deducted from deposit amount
- **Example**: User deposits ₦10,000 → Receives ₦9,700 (₦300 fee)
- **File**: `src/services/wallet.service.ts`
- **Transaction Type**: `DEPOSIT`

#### Withdrawals (EXISTING)
- **Fee**: 3% deducted from withdrawal amount
- **Example**: User withdraws ₦10,000 → Receives ₦9,700 (₦300 fee)
- **File**: `src/services/withdrawal.service.ts`
- **Transaction Type**: `WITHDRAWAL`

#### Escrow (EXISTING)
- **Fee**: 3% added to escrow amount
- **Example**: Escrow ₦10,000 → Buyer pays ₦10,300 (₦300 fee)
- **File**: `src/services/escrow.service.ts`
- **Transaction Type**: `ESCROW_DEPOSIT`

#### Marketplace Sales (NEW)
- **Fee**: 3% deducted from seller's payout
- **Example**: Item sells for ₦10,000 → Seller receives ₦9,700 (₦300 fee)
- **Files**: 
  - `src/services/purchase.service.ts` (NEW)
  - `src/controllers/purchase.controller.ts` (UPDATED)
- **Transaction Types**: 
  - `PURCHASE` (buyer's transaction)
  - `SALE` (seller's transaction)
  - `FEE_CHARGE` (platform fee record)

---

### 2. **Video Upload Restrictions** 📹

#### Game Marketplace
- **Videos**: ✅ Allowed
- **Duration Limit**: 2 minutes maximum
- **Validation**: Server-side check via Cloudinary
- **Action**: Videos exceeding 2 minutes are rejected and deleted
- **File Size**: Up to 50MB

#### Social Media Marketplace
- **Videos**: ❌ NOT Allowed
- **Images**: ✅ Allowed
- **Reason**: Social media account listings should only show screenshots/images
- **Validation**: Server-side and client-side checks

#### Social Feed (Regular Posts)
- **Videos**: ✅ Allowed
- **Images**: ✅ Allowed
- **No Duration Limit**: Users can post any length videos

**Files Updated**:
- `src/services/post.service.ts` - Added video validation logic
- `src/controllers/post.controller.ts` - Updated multer config and upload handler

---

## 📊 Transaction Flow Examples

### Example 1: Marketplace Purchase
```
Buyer wants to buy a game account for ₦10,000

1. Buyer's wallet: ₦15,000
2. Platform fee (3%): ₦300
3. Total deducted from buyer: ₦10,300
4. Seller delivers account
5. Buyer confirms receipt
6. Seller receives: ₦9,700 (₦10,000 - ₦300 fee)
7. Platform keeps: ₦300

Transactions created:
- PURCHASE (buyer): -₦10,300
- FEE_CHARGE (platform): ₦300
- SALE (seller): +₦9,700
```

### Example 2: Deposit
```
User deposits ₦20,000

1. User initiates deposit via payment gateway
2. Payment gateway charges: ₦20,000
3. Platform fee (3%): ₦600
4. User receives in wallet: ₦19,400

Transaction created:
- DEPOSIT: ₦20,000 (amount), ₦600 (fee), ₦19,400 (netAmount)
```

### Example 3: Withdrawal
```
User withdraws ₦15,000

1. User's wallet balance: ₦20,000
2. Withdrawal fee (3%): ₦450
3. Deducted from wallet: ₦15,000
4. User receives in bank: ₦14,550

Transaction created:
- WITHDRAWAL: ₦15,000 (amount), ₦450 (fee), ₦14,550 (netAmount)
```

---

## 🔧 API Endpoints

### Purchase Endpoints (NEW)
```
POST   /api/purchases                    - Create purchase (buyer)
POST   /api/purchases/:id/deliver        - Deliver account (seller)
POST   /api/purchases/:id/confirm        - Confirm receipt (buyer)
GET    /api/purchases                    - Get user's purchases
GET    /api/purchases/sales              - Get user's sales
GET    /api/purchases/:id                - Get purchase details
```

### Media Upload
```
POST   /api/posts/upload-media           - Upload images/videos
Body: { postType: 'GAME_ACCOUNT' | 'SOCIAL_ACCOUNT' | 'SOCIAL_POST' }
```

---

## 🎨 Post Types

| Post Type | Videos Allowed | Video Duration Limit | Images Allowed |
|-----------|----------------|---------------------|----------------|
| `GAME_ACCOUNT` | ✅ Yes | 2 minutes max | ✅ Yes |
| `SOCIAL_ACCOUNT` | ❌ No | N/A | ✅ Yes |
| `SOCIAL_POST` | ✅ Yes | No limit | ✅ Yes |

---

## 📝 Database Changes

### New Service Files
- `src/services/purchase.service.ts` - Handles marketplace purchases with 3% fee
- `src/controllers/purchase.controller.ts` - Purchase API endpoints

### Updated Files
- `src/services/wallet.service.ts` - Added 3% fee to deposits
- `src/services/post.service.ts` - Added video validation and duration limits
- `src/controllers/post.controller.ts` - Updated file upload handling

### Transaction Types Used
- `DEPOSIT` - User deposits money (3% fee)
- `WITHDRAWAL` - User withdraws money (3% fee)
- `PURCHASE` - Buyer purchases item (includes 3% fee)
- `SALE` - Seller receives payment (minus 3% fee)
- `FEE_CHARGE` - Platform fee record
- `ESCROW_DEPOSIT` - Escrow funding (3% fee)
- `ESCROW_RELEASE` - Escrow release to seller

---

## 🚀 Deployment

### Backend (Render)
```bash
git add -A
git commit -m "Add 3% fees to deposits/sales and video upload restrictions"
git push origin main
```

### Frontend (Vercel)
```bash
cd web
vercel --prod
```

---

## ✅ Testing Checklist

- [ ] Test deposit with 3% fee deduction
- [ ] Test marketplace purchase with 3% fee
- [ ] Test seller receiving payment minus 3% fee
- [ ] Test video upload for game marketplace (2-minute limit)
- [ ] Test video rejection for social media marketplace
- [ ] Test image upload for all post types
- [ ] Verify transaction records are created correctly
- [ ] Check notifications are sent to buyers and sellers

---

## 📌 Notes

1. **All fees are 3%** across deposits, withdrawals, escrow, and sales
2. **Video limits only apply to marketplace listings**, not social feed posts
3. **Social media marketplace** (selling TikTok, Instagram accounts) only allows images
4. **Game marketplace** (selling game accounts) allows videos up to 2 minutes
5. **Platform fees are automatically calculated** and recorded in transactions
6. **Sellers receive net amount** after platform fee deduction
7. **Buyers pay listing price + platform fee** for purchases

---

**Last Updated**: November 15, 2025
**Status**: Ready for Deployment
