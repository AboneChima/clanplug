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

## 🚀 IMPORTANT: Create Storage Bucket Now!

### Step 1: Go to Supabase Dashboard
Visit: **https://supabase.com/dashboard/project/htfnwvaqrhzcoybphiqk/storage/buckets**

### Step 2: Create the "uploads" Bucket
1. Click **"New bucket"** button (green button on the right)
2. Fill in the form:
   - **Name**: `uploads` (must be exactly this)
   - **Public bucket**: ✅ **ENABLE THIS** (toggle it on)
   - **File size limit**: `52428800` (50 MB in bytes)
   - **Allowed MIME types**: Leave empty or add:
     ```
     image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm
     ```
3. Click **"Create bucket"**

### Step 3: Configure Bucket Policies (CRITICAL!)

After creating the bucket:

1. Click on the **"uploads"** bucket in the list
2. Click the **"Policies"** tab at the top
3. You'll see "No policies created yet"
4. Click **"New Policy"** button

#### Option A: Use Quick Templates (Easiest)
1. Click **"Get started quickly"**
2. Enable these templates:
   - ✅ **"Allow public read access"** - Click "Use this template"
   - ✅ **"Allow authenticated uploads"** - Click "Use this template"

#### Option B: Create Custom Policies (Advanced)
If templates don't work, create these policies manually:

**Policy 1: Public Read**
- Name: `Public Access`
- Policy command: `SELECT`
- Target roles: `public`
- SQL:
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );
```

**Policy 2: Service Role Full Access**
- Name: `Service role full access`
- Policy command: `ALL`
- Target roles: `service_role`
- SQL:
```sql
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING ( bucket_id = 'uploads' );
```

### Step 4: Verify Setup
After creating the bucket and policies, you should see:
- ✅ Bucket named "uploads" with public access enabled
- ✅ At least 2 policies active

### Step 5: Test Upload
Try uploading a post with an image from your app. Check the backend logs for any errors.

## 🔍 Quick Verification Checklist

Before testing uploads, verify:
- [ ] Bucket "uploads" exists in Supabase dashboard
- [ ] Bucket is marked as "Public"
- [ ] At least 2 policies are active (public read + service role)
- [ ] Environment variables are set in `.env`
- [ ] Backend server is restarted after changes

## 📊 Storage Pricing

**Free Tier:**
- 1 GB storage
- 2 GB bandwidth/month
- Perfect for starting out!

**Paid Tier (when you grow):**
- $0.021/GB storage per month (~₦35/GB)
- $0.09/GB bandwidth (~₦150/GB)

**Comparison with Cloudinary:**
- Cloudinary Free: 25 GB storage, 25 GB bandwidth (but account suspended!)
- Cloudinary Paid: Starts at $89/month (~₦150,000/month)
- **Supabase is 90% cheaper for most use cases!**

## 🔧 Folder Structure

Files are organized as:
- `posts/[timestamp]-[filename]` - Social feed and marketplace posts
- `kyc/[timestamp]-[filename]` - KYC verification documents

Example URL:
```
https://htfnwvaqrhzcoybphiqk.supabase.co/storage/v1/object/public/uploads/posts/1737123456789-image.jpg
```

## ✅ Benefits of Supabase Storage

1. **Cost-effective**: Pay only $0.021/GB vs Cloudinary's $89/month
2. **No surprise limits**: Clear pricing, no account suspensions
3. **Fast CDN**: Global edge network for quick delivery
4. **Integrated**: Works with Supabase Auth and Database
5. **Simple**: Easy to set up and manage

## 🐛 Troubleshooting

### "Supabase is not configured" error
- Check `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Restart your backend server

### "Failed to upload to Supabase" error
- Verify bucket "uploads" exists
- Check bucket is set to **public**
- Verify policies are correctly set
- Check service role key is correct

### "Bucket not found" error
- Bucket name must be exactly `uploads` (lowercase)
- Create the bucket in Supabase dashboard

### Files upload but can't be accessed
- Bucket must be marked as **public**
- Add "Public Access" policy for SELECT operations

### Test the connection
Run this command to test:
```bash
node test-supabase-connection.js
```

## 📝 Migration Notes

- ✅ Old Cloudinary URLs will continue working for existing posts
- ✅ All new uploads will use Supabase
- ✅ You can migrate old files later if needed
- ✅ Cloudinary code kept as fallback (commented out)

## 🎯 Next Steps After Setup

1. Create the "uploads" bucket in Supabase dashboard
2. Enable public access on the bucket
3. Add the required policies
4. Restart your backend server
5. Test by uploading a post with an image
6. Monitor the free tier usage in Supabase dashboard

## 💡 Pro Tips

- Monitor your storage usage in Supabase dashboard
- Set up alerts when approaching 1GB limit
- Compress images before upload to save space
- Consider upgrading to paid tier when you hit 1GB
- Keep Cloudinary as backup for critical files

