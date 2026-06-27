-- Final Migration Status Check

\echo '=== USERS ==='
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as kyc_verified FROM users WHERE "isKYCVerified" = true;

\echo ''
\echo '=== POSTS ==='
SELECT COUNT(*) as total_posts FROM posts;

\echo ''
\echo '=== CHATS ==='
SELECT COUNT(*) as total_chats FROM chats;
SELECT COUNT(*) as chats_with_messages FROM (
  SELECT DISTINCT "chatId" FROM chat_messages
) as chats;

\echo ''
\echo '=== MESSAGES ==='
SELECT COUNT(*) as total_messages FROM chat_messages;

\echo ''
\echo '=== VERIFICATION BADGES ==='
SELECT COUNT(*) as total_badges FROM verification_badges;
SELECT COUNT(*) as active_badges FROM verification_badges WHERE status = 'active';

\echo ''
\echo '=== SAMPLE: Users with Badges ==='
SELECT u.username, vb.status, vb."expiresAt"
FROM users u
INNER JOIN verification_badges vb ON u.id = vb."userId"
LIMIT 5;

\echo ''
\echo '=== SAMPLE: Chat with Messages ==='
SELECT c.id as chat_id, COUNT(m.id) as message_count
FROM chats c
LEFT JOIN chat_messages m ON c.id = m."chatId"
GROUP BY c.id
HAVING COUNT(m.id) > 0
LIMIT 3;
