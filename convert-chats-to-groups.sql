-- Convert all chats with 3+ participants to GROUP type
UPDATE "Chat"
SET type = 'GROUP'
WHERE id IN (
  SELECT c.id
  FROM "Chat" c
  JOIN "ChatParticipant" cp ON c.id = cp."chatId"
  WHERE cp."isActive" = true
  GROUP BY c.id
  HAVING COUNT(cp.id) >= 3
);

-- Show results
SELECT 
  c.id,
  c.name,
  c.type,
  COUNT(cp.id) as member_count
FROM "Chat" c
LEFT JOIN "ChatParticipant" cp ON c.id = cp."chatId"
WHERE cp."isActive" = true
GROUP BY c.id, c.name, c.type
HAVING COUNT(cp.id) >= 3
ORDER BY member_count DESC;
