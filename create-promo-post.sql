-- Create verification promo post for abonejoseph@gmail.com
-- First, you need to upload the image to Cloudinary and get the URL
-- Then replace 'YOUR_CLOUDINARY_URL_HERE' with the actual URL

DO $$
DECLARE
  user_id TEXT;
  post_id TEXT;
  cloudinary_url TEXT := 'YOUR_CLOUDINARY_URL_HERE'; -- Replace this!
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM users WHERE email = 'abonejoseph@gmail.com';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Generate post ID
  post_id := 'promo_' || EXTRACT(EPOCH FROM NOW())::TEXT;

  -- Create the promo post
  INSERT INTO posts (
    id,
    "userId",
    type,
    status,
    title,
    description,
    images,
    "isFeatured",
    "createdAt",
    "updatedAt"
  ) VALUES (
    post_id,
    user_id,
    'SOCIAL_POST',
    'ACTIVE',
    'Verification Promo - Get Verified for ₦2K!',
    '🔥 VERIFICATION PROMO ALERT! 🔥

Get your BLUE VERIFIED BADGE for just ₦2,000! 
(Regular price: ₦5,000)

✅ Stand out with the blue checkmark
✅ Build instant credibility  
✅ Get priority support
✅ Unlock exclusive features
✅ Boost your profile visibility

Limited slots available! Don''t miss out! 🚀

Drop a 🔥 if you''re getting verified!

#GetVerified #ClanPlugVerified #NigerianCreators #VerifiedBadge #LimitedOffer',
    ARRAY[cloudinary_url],
    true,
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Promo post created successfully!';
  RAISE NOTICE 'Post ID: %', post_id;
END $$;

-- Verify the post was created
SELECT 
  p.id,
  p.title,
  p.description,
  p.images,
  u.username,
  p."createdAt"
FROM posts p
JOIN users u ON p."userId" = u.id
WHERE u.email = 'abonejoseph@gmail.com'
ORDER BY p."createdAt" DESC
LIMIT 1;
