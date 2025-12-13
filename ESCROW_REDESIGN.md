# Escrow System Redesign - Professional Flow

## Current Problems
1. ❌ Money deducted immediately without seller confirmation
2. ❌ Seller might not be online
3. ❌ No push notifications
4. ❌ Buyer left stranded if seller doesn't respond
5. ❌ Can create duplicate purchases

## New Professional Flow (Like Bolt/Uber)

### Step 1: Purchase Request (NO PAYMENT YET)
- Buyer clicks "Buy Now"
- System creates a **PURCHASE_REQUEST** (not escrow yet)
- Shows seller info to buyer
- Status: `PENDING_SELLER_RESPONSE`
- Expires in 5 minutes if no response

### Step 2: Seller Notification
- **Push notification** to seller's phone
- **In-app notification** with sound/vibration
- Shows: Buyer name, item, price
- Actions: Accept / Reject
- Timer: 5 minutes to respond

### Step 3: Seller Response
**If Seller Accepts:**
- Buyer gets notification: "Seller accepted! Proceed to payment"
- Buyer confirms payment
- Money deducted and held in escrow
- Status: `FUNDED`

**If Seller Rejects:**
- Buyer gets notification: "Seller declined your request"
- Request cancelled
- No money deducted

**If Seller Doesn't Respond:**
- After 5 minutes, request expires
- Buyer gets notification: "Seller didn't respond. Try another listing"
- No money deducted

### Step 4: Delivery & Confirmation
- Seller delivers item
- Buyer confirms receipt
- Money released to seller

## Database Changes Needed

### New Table: PurchaseRequest
```prisma
model PurchaseRequest {
  id          String   @id @default(uuid())
  buyerId     String
  sellerId    String
  postId      String
  amount      Decimal
  currency    Currency
  status      RequestStatus // PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  buyer       User     @relation("BuyerRequests", fields: [buyerId], references: [id])
  seller      User     @relation("SellerRequests", fields: [sellerId], references: [id])
  post        Post     @relation(fields: [postId], references: [id])
}

enum RequestStatus {
  PENDING_SELLER_RESPONSE
  ACCEPTED
  REJECTED
  EXPIRED
  CANCELLED
}
```

## Push Notifications Setup

### Using Firebase Cloud Messaging (FCM)
1. Install: `npm install firebase-admin`
2. Store device tokens in User table
3. Send push when purchase request created

### Notification Payload
```json
{
  "title": "💰 New Purchase Request!",
  "body": "John wants to buy your TikTok account for ₦5,000",
  "data": {
    "type": "PURCHASE_REQUEST",
    "requestId": "req_123",
    "postId": "post_456",
    "buyerId": "user_789"
  },
  "sound": "default",
  "priority": "high"
}
```

## Implementation Steps

### Backend
1. Create PurchaseRequest model
2. Add FCM notification service
3. Create endpoints:
   - POST /api/purchase-requests (create request)
   - POST /api/purchase-requests/:id/accept (seller accepts)
   - POST /api/purchase-requests/:id/reject (seller rejects)
   - GET /api/purchase-requests (get user's requests)
4. Add cron job to expire old requests

### Frontend
1. Update "Buy Now" flow - don't create escrow immediately
2. Add seller response modal
3. Add request status tracking
4. Show timer for pending requests
5. Add push notification permission request

## User Experience

### For Buyer
1. Click "Buy Now" → See seller info
2. Click "Send Request" → Wait for seller
3. Get notification when seller responds
4. If accepted → Proceed to payment
5. If rejected/expired → Try another listing

### For Seller
1. Get push notification on phone
2. Open app → See purchase request
3. View buyer profile
4. Accept or Reject
5. If accept → Wait for buyer payment
6. Deliver item when funded

## Benefits
✅ No money deducted until seller confirms
✅ Seller knows someone wants to buy
✅ Buyer knows seller is available
✅ Professional experience like Bolt/Uber
✅ No one left stranded
✅ Clear communication flow
