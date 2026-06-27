-- Check which chats have messages
SELECT c.id, COUNT(m.id) as message_count 
FROM chats c 
LEFT JOIN chat_messages m ON c.id = m."chatId" 
GROUP BY c.id 
HAVING COUNT(m.id) > 0 
ORDER BY COUNT(m.id) DESC
LIMIT 10;

-- Show a sample message
SELECT id, "chatId", "userId", content, "createdAt" 
FROM chat_messages 
ORDER BY "createdAt" DESC 
LIMIT 5;
