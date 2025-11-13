# Cloudinary Setup Guide

## What is Cloudinary?
Cloudinary is a cloud-based service for storing and managing images and videos. It provides:
- Free tier (25GB storage, 25GB bandwidth/month)
- Automatic image/video optimization
- CDN delivery (fast loading worldwide)
- Video transcoding
- Image transformations

## How to Get Cloudinary API Keys

### Step 1: Sign Up
1. Go to https://cloudinary.com/users/register/free
2. Sign up with your email
3. Verify your email

### Step 2: Get Your Credentials
1. Login to https://cloudinary.com/console
2. You'll see your **Dashboard** with:
   - **Cloud Name**: (e.g., `dxyz123abc`)
   - **API Key**: (e.g., `123456789012345`)
   - **API Secret**: (e.g., `abcdefghijklmnopqrstuvwxyz`)

### Step 3: Add to Your Backend

Add these to your `.env` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Add to Render environment variables:
```bash
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
```

### Step 4: Configure Upload Settings

In Cloudinary Dashboard:
1. Go to **Settings** → **Upload**
2. Enable **Unsigned uploading** (for direct browser uploads)
3. Create an **Upload Preset**:
   - Name: `lordmoon_uploads`
   - Signing Mode: **Unsigned**
   - Folder: `lordmoon`
   - Max file size: 10MB
   - Allowed formats: jpg, png, gif, mp4, mov

### Step 5: Add to Frontend

Add to `web/.env.local`:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=lordmoon_uploads
```

## Free Tier Limits
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **Video**: Up to 10 minutes per video

## Pricing (if you need more)
- **Plus Plan**: $99/month (100GB storage, 100GB bandwidth)
- **Advanced Plan**: $249/month (200GB storage, 200GB bandwidth)

## Alternative Free Options

### 1. Vercel Blob Storage
- Free: 500MB storage
- Good for small files
- Integrated with Vercel

### 2. AWS S3 (Free Tier)
- 5GB storage free for 12 months
- More complex setup
- Pay-as-you-go after free tier

### 3. Supabase Storage
- 1GB free storage
- Simple API
- Good for images

## Recommendation
**Use Cloudinary** - It's the easiest and most feature-rich option for your use case. The free tier is generous and perfect for starting out.

## Implementation Status
✅ Backend already has Cloudinary integration
✅ Just need to add your API keys
✅ Frontend upload component ready
✅ Video upload supported
