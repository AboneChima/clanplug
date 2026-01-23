-- Delete user ogechui26@gmail.com and all related data
-- Run this script carefully as it's irreversible!

-- First, let's find the user ID
DO $$
DECLARE
    user_id_to_delete TEXT;
BEGIN
    -- Get the user ID
    SELECT id INTO user_id_to_delete
    FROM users
    WHERE email = 'ogechui26@gmail.com';

    IF user_id_to_delete IS NULL THEN
        RAISE NOTICE 'User ogechui26@gmail.com not found';
    ELSE
        RAISE NOTICE 'Found user with ID: %', user_id_to_delete;
        
        -- Delete in order to respect foreign key constraints
        
        -- 1. Delete VTU transactions
        DELETE FROM "VTUTransaction" WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted VTU transactions';
        
        -- 2. Delete transactions
        DELETE FROM transactions WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted transactions';
        
        -- 3. Delete wallets
        DELETE FROM wallets WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted wallets';
        
        -- 4. Delete notifications
        DELETE FROM notifications WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted notifications';
        
        -- 5. Delete KYC verifications
        DELETE FROM "KYCVerification" WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted KYC verifications';
        
        -- 6. Delete verification badge
        DELETE FROM "VerificationBadge" WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted verification badge';
        
        -- 7. Delete posts (and related likes, comments, bookmarks will cascade)
        DELETE FROM posts WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted posts';
        
        -- 8. Delete likes
        DELETE FROM likes WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted likes';
        
        -- 9. Delete comments
        DELETE FROM comments WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted comments';
        
        -- 10. Delete bookmarks
        DELETE FROM "Bookmark" WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted bookmarks';
        
        -- 11. Delete follows (both as follower and following)
        DELETE FROM follows WHERE "followerId" = user_id_to_delete OR "followingId" = user_id_to_delete;
        RAISE NOTICE 'Deleted follows';
        
        -- 12. Delete chat messages
        DELETE FROM "ChatMessage" WHERE "senderId" = user_id_to_delete;
        RAISE NOTICE 'Deleted chat messages';
        
        -- 13. Delete chat participants
        DELETE FROM "ChatParticipant" WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted chat participants';
        
        -- 14. Delete escrow messages
        DELETE FROM "EscrowMessage" WHERE "senderId" = user_id_to_delete;
        RAISE NOTICE 'Deleted escrow messages';
        
        -- 15. Delete escrows (as buyer or seller)
        DELETE FROM escrows WHERE "buyerId" = user_id_to_delete OR "sellerId" = user_id_to_delete;
        RAISE NOTICE 'Deleted escrows';
        
        -- 16. Delete purchase requests (as buyer or seller)
        DELETE FROM "PurchaseRequest" WHERE "buyerId" = user_id_to_delete OR "sellerId" = user_id_to_delete;
        RAISE NOTICE 'Deleted purchase requests';
        
        -- 17. Delete listings
        DELETE FROM listings WHERE "sellerId" = user_id_to_delete;
        RAISE NOTICE 'Deleted listings';
        
        -- 18. Delete purchases (as buyer or seller)
        DELETE FROM purchases WHERE "buyerId" = user_id_to_delete OR "sellerId" = user_id_to_delete;
        RAISE NOTICE 'Deleted purchases';
        
        -- 19. Delete reports (as reporter or reported)
        DELETE FROM reports WHERE "reporterId" = user_id_to_delete OR "reportedUserId" = user_id_to_delete;
        RAISE NOTICE 'Deleted reports';
        
        -- 20. Delete stories
        DELETE FROM stories WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted stories';
        
        -- 21. Delete story views
        DELETE FROM "StoryView" WHERE "userId" = user_id_to_delete;
        RAISE NOTICE 'Deleted story views';
        
        -- Finally, delete the user
        DELETE FROM users WHERE id = user_id_to_delete;
        RAISE NOTICE 'Deleted user ogechui26@gmail.com successfully!';
        
    END IF;
END $$;

-- Verify deletion
SELECT COUNT(*) as remaining_users 
FROM users 
WHERE email = 'ogechui26@gmail.com';
-- Should return 0 if successful
