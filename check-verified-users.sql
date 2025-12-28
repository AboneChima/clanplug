-- Check all verified users and their expiration dates

SELECT 
    u.username,
    u.email,
    u."firstName",
    u."lastName",
    vb.status,
    vb."purchasedAt",
    vb."expiresAt",
    CASE 
        WHEN vb."expiresAt" IS NULL THEN 'No expiration'
        WHEN vb."expiresAt" > NOW() THEN 
            CONCAT(
                EXTRACT(DAY FROM (vb."expiresAt" - NOW())), 
                ' days remaining'
            )
        ELSE 'EXPIRED'
    END as time_remaining,
    vb."createdAt"
FROM users u
INNER JOIN verification_badges vb ON vb."userId" = u.id
ORDER BY vb."createdAt" DESC;

-- Count by status
SELECT 
    status,
    COUNT(*) as count
FROM verification_badges
GROUP BY status;

-- Show expired vs active
SELECT 
    CASE 
        WHEN "expiresAt" IS NULL THEN 'No expiration set'
        WHEN "expiresAt" > NOW() THEN 'Active'
        ELSE 'Expired'
    END as badge_status,
    COUNT(*) as count
FROM verification_badges
GROUP BY badge_status;
