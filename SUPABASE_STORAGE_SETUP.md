# Supabase Storage Setup Guide

## ✅ What's Already Done

1. **Supabase service created** (`src/services/supabase.service.ts`)
2. **Configuration added** to `src/config/config.ts`
3. **Environment variables set** in `.env`:
   - `SUPABASE_URL=https://htfnwvaqrhzcoybphiqk.supabase.co`
   - `SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `SUPABASE_BUCKET=uploads`
4. **Post service updated** to use Supabase instead of Cloudinary
5. **@supabase/supabase-js package installed**

## 🚀 Next Steps - Create Storage Bucket

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/htfnwvaqrhzcoybphiqk
2. Login to your account

### Step 2: Create Storage Bucket
1. Click on **Storage** in the left sidebar
2. Click **New bucket** button
3. Configure the bucket:
   - **Name**: `uploads`
   - **Public bucket**: ✅ **Enable** (so files are publicly accessible)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: Leave empty (allow all) or specify:
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `video/mp4`
     - `video/quicktime`
     - `video/webm`
4. Click **Create bucket**

### Step 3: Set Bucket Policies (Important!)
After creating the bucket, you need to set policies for public access:

1. Click on the **uploads** bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Select **For full customization** → **Get started**

**Policy 1: Public Read Access**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );
```

**Policy 3: Service Role Full Access** (for backend uploads)
```sql
CREATE POLICY "Service role can do everything"
ON storage.objects FOR ALL
USING ( bucket_id = 'uploads' );
```

Or use the **Quick Policy Templates**:
- Enable **"Allow public read access"**
- Enable **"Allow authenticated uploads"**

### Step 4: Test the Setup
Once the bucket is created, test by uploading a post with an image from your app.

## 📊 Storage Pricing

**Free Tier:**
- 1 GB storage
- 2 GB bandwidth/month

**Paid Tier (if needed):**
- $0.021/GB storage per month
- $0.09/GB bandwidth

**Comparison with Cloudinary:**
- Cloudinary Free: 25 GB storage, 25 GB bandwidth
- Cloudinary Paid: Starts at $89/month
- **Supabase is much more cost-effective for growing apps!**

## 🔧 Folder Structure

Files will be organized as:
- `posts/` - Social feed and marketplace posts
- `kyc/` - KYC verification documents

## ✅ Benefits of Supabase Storage

1. **Cost-effective**: Much cheaper than Cloudinary
2. **Simple pricing**: Pay only for what you use
3. **Fast CDN**: Global edge network
4. **Integrated**: Works seamlessly with Supabase Auth
5. **No account suspension**: No surprise limits

## 🐛 Troubleshooting

**If uploads fail:**
1. Check bucket exists and is named `uploads`
2. Verify bucket is set to **public**
3. Check policies are correctly set
4. Verify environment variables in `.env`
5. Check backend logs for detailed error messages

**Test connection:**
```bash
# In your backend, you can test by making a simple upload
curl -X POST http://localhost:4000/api/posts/upload-media \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "media=@test-image.jpg"
```

## 📝 Migration Notes

- Old Cloudinary URLs will still work for existing posts
- New uploads will use Supabase
- You can migrate old files later if needed
- Cloudinary code kept as fallback (commented out)
