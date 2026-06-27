-- Check posts
SELECT COUNT(*) as total_posts, 
       COUNT(CASE WHEN type = 'SOCIAL_POST' THEN 1 END) as social_posts,
       COUNT(CASE WHEN type = 'GAME_ACCOUNT' THEN 1 END) as game_posts
FROM posts;

-- Check messages
SELECT COUNT(*) as total_messages FROM chat_messages;

-- Check chats
SELECT COUNT(*) as total_chats FROM chats;

-- Check KYC verifications
SELECT COUNT(*) as total_kyc FROM kyc_verifications;
SELECT COUNT(*) as verified_users FROM users WHERE "isKYCVerified" = true;

-- Check verification badges
SELECT COUNT(*) as total_badges FROM verification_badges;
SELECT COUNT(*) as active_badges FROM verification_badges WHERE status = 'active';

-- Check a sample user to see their data
SELECT id, username, "firstName", "lastName", "isKYCVerified", "isEmailVerified" 
FROM users LIMIT 5;
