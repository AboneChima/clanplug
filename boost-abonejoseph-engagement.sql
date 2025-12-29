-- Boost engagement for abonejoseph@gmail.com
-- Add 5000 bot followers, 300 likes on their post, and 30 comments

DO $$
DECLARE
  target_user_id TEXT;
  target_post_id TEXT;
  bot_user_id TEXT;
  i INTEGER;
  comment_texts TEXT[] := ARRAY[
    '🔥🔥🔥 This is huge!',
    'Davido following you? That''s legendary! 🎵',
    'You''re blowing up! Congrats! 🚀',
    '150k is just the beginning bro 💯',
    'When Davido follows, you know you''ve made it 👑',
    'Your content is fire! Keep it up! 🔥',
    'This is inspiring! How did you do it? 💪',
    'Massive W! You deserve all the success 🙌',
    'The grind is paying off! Respect! 💪',
    'Davido knows talent when he sees it 🎤',
    'You''re next up! Mark my words 📈',
    'This is the motivation I needed today 💯',
    'From 0 to 150k, that''s crazy growth! 🚀',
    'Your journey is incredible! 🌟',
    'Big things coming your way! 🔥',
    'When the OBO follows you, you''ve arrived! 🎵',
    'This is what hard work looks like! 💪',
    'You''re an inspiration to us all! 🙏',
    'The algorithm is blessing you! 📊',
    'Your time is now! Keep pushing! 🚀',
    'Davido following = instant credibility 👑',
    'You''re trending! I see you everywhere! 📱',
    'This is just the start of something big! 🌟',
    'Your content strategy is on point! 💯',
    'From the streets to the stars! 🌟',
    'You''re making Nigeria proud! 🇳🇬',
    'This is the energy we need! 🔥',
    'Your growth is exponential! 📈',
    'Davido co-sign is everything! 🎤',
    'You''re the next big thing! Watch! 👀'
  ];
BEGIN
  -- Get the target user ID
  SELECT id INTO target_user_id FROM users WHERE email = 'abonejoseph@gmail.com';
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email abonejoseph@gmail.com not found';
  END IF;

  -- Get the user's post (assuming they have at least one post)
  SELECT id INTO target_post_id FROM posts 
  WHERE "userId" = target_user_id 
  AND description LIKE '%150k%followers%davido%'
  ORDER BY "createdAt" DESC 
  LIMIT 1;

  IF target_post_id IS NULL THEN
    -- If no specific post found, get their latest post
    SELECT id INTO target_post_id FROM posts 
    WHERE "userId" = target_user_id 
    ORDER BY "createdAt" DESC 
    LIMIT 1;
  END IF;

  IF target_post_id IS NULL THEN
    RAISE EXCEPTION 'No posts found for this user';
  END IF;

  RAISE NOTICE 'Target User ID: %', target_user_id;
  RAISE NOTICE 'Target Post ID: %', target_post_id;

  -- Create 5000 bot users
  FOR i IN 1..5000 LOOP
    -- Create bot user
    INSERT INTO users (
      id,
      email,
      username,
      "firstName",
      "lastName",
      "passwordHash",
      status,
      "referralCode",
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid()::TEXT,
      'bot' || i || '@clanplug.bot',
      'user_' || LPAD(i::TEXT, 5, '0'),
      CASE 
        WHEN i % 10 = 0 THEN 'David'
        WHEN i % 10 = 1 THEN 'Sarah'
        WHEN i % 10 = 2 THEN 'Michael'
        WHEN i % 10 = 3 THEN 'Jennifer'
        WHEN i % 10 = 4 THEN 'James'
        WHEN i % 10 = 5 THEN 'Linda'
        WHEN i % 10 = 6 THEN 'Robert'
        WHEN i % 10 = 7 THEN 'Patricia'
        WHEN i % 10 = 8 THEN 'John'
        ELSE 'Mary'
      END,
      'User ' || i,
      '$2b$10$dummyhashedpasswordthatwontwork123456789012345678901234',
      'ACTIVE',
      'BOT' || LPAD(i::TEXT, 6, '0'),
      NOW() - (random() * INTERVAL '30 days'),
      NOW()
    ) RETURNING id INTO bot_user_id;

    -- Make bot follow the target user
    INSERT INTO follows (
      id,
      "followerId",
      "followingId",
      "createdAt"
    ) VALUES (
      gen_random_uuid()::TEXT,
      bot_user_id,
      target_user_id,
      NOW() - (random() * INTERVAL '30 days')
    );

    -- First 300 bots like the post
    IF i <= 300 THEN
      INSERT INTO likes (
        id,
        "userId",
        "postId",
        "createdAt"
      ) VALUES (
        gen_random_uuid()::TEXT,
        bot_user_id,
        target_post_id,
        NOW() - (random() * INTERVAL '7 days')
      );
    END IF;

    -- First 30 bots comment on the post
    IF i <= 30 THEN
      INSERT INTO comments (
        id,
        content,
        "userId",
        "postId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid()::TEXT,
        comment_texts[i],
        bot_user_id,
        target_post_id,
        NOW() - (random() * INTERVAL '7 days'),
        NOW() - (random() * INTERVAL '7 days')
      );
    END IF;

    -- Log progress every 500 users
    IF i % 500 = 0 THEN
      RAISE NOTICE 'Created % bot users...', i;
    END IF;
  END LOOP;

  RAISE NOTICE 'Successfully created 5000 bot followers, 300 likes, and 30 comments!';
END $$;

-- Verify the results
SELECT 
  u.email,
  u.username,
  u."firstName",
  u."lastName",
  (SELECT COUNT(*) FROM follows WHERE "followingId" = u.id) as follower_count,
  (SELECT COUNT(*) FROM posts WHERE "userId" = u.id) as post_count
FROM users u
WHERE u.email = 'abonejoseph@gmail.com';

-- Check the post engagement
SELECT 
  p.id,
  p.description,
  (SELECT COUNT(*) FROM likes WHERE "postId" = p.id) as like_count,
  (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as comment_count
FROM posts p
WHERE p."userId" = (SELECT id FROM users WHERE email = 'abonejoseph@gmail.com')
ORDER BY p."createdAt" DESC
LIMIT 1;

-- Show some sample comments
SELECT 
  c.content,
  u.username,
  c."createdAt"
FROM comments c
JOIN users u ON c."userId" = u.id
WHERE c."postId" = (
  SELECT p.id FROM posts p
  WHERE p."userId" = (SELECT id FROM users WHERE email = 'abonejoseph@gmail.com')
  ORDER BY p."createdAt" DESC
  LIMIT 1
)
ORDER BY c."createdAt" DESC
LIMIT 10;
