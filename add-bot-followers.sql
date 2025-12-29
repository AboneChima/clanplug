-- Add 200 bot followers to abonejoseph@gmail.com
-- First, get the user ID
-- SELECT id FROM "User" WHERE email = 'abonejoseph@gmail.com';

-- Create 200 bot users and make them follow abonejoseph
DO $$
DECLARE
  target_user_id TEXT;
  bot_user_id TEXT;
  i INTEGER;
BEGIN
  -- Get the target user ID
  SELECT id INTO target_user_id FROM "User" WHERE email = 'abonejoseph@gmail.com';
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email abonejoseph@gmail.com not found';
  END IF;

  -- Create 200 bot users and make them follow the target user
  FOR i IN 1..200 LOOP
    -- Create bot user
    INSERT INTO "User" (
      id,
      email,
      username,
      "firstName",
      "lastName",
      password,
      status,
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid()::TEXT,
      'bot' || i || '@clanplug.bot',
      'bot_user_' || i,
      'Bot',
      'User ' || i,
      '$2b$10$dummyhashedpasswordthatwontwork123456789012345678901234', -- Dummy hash, can't login
      'ACTIVE',
      NOW(),
      NOW()
    ) RETURNING id INTO bot_user_id;

    -- Make bot follow the target user
    INSERT INTO "Follow" (
      id,
      "followerId",
      "followingId",
      "createdAt"
    ) VALUES (
      gen_random_uuid()::TEXT,
      bot_user_id,
      target_user_id,
      NOW()
    );
  END LOOP;

  RAISE NOTICE 'Successfully created 200 bot followers for user %', target_user_id;
END $$;

-- Verify the follower count
SELECT 
  u.email,
  u.username,
  u."firstName",
  u."lastName",
  COUNT(f.id) as follower_count
FROM "User" u
LEFT JOIN "Follow" f ON f."followingId" = u.id
WHERE u.email = 'abonejoseph@gmail.com'
GROUP BY u.id, u.email, u.username, u."firstName", u."lastName";
