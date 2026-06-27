-- Add MARKETPLACE_LISTING to PostType enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'MARKETPLACE_LISTING' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PostType')
    ) THEN
        ALTER TYPE "PostType" ADD VALUE 'MARKETPLACE_LISTING';
    END IF;
END $$;

-- Fix bookmarks table permissions
GRANT ALL PRIVILEGES ON TABLE bookmarks TO clanplug_user;
GRANT ALL PRIVILEGES ON TABLE likes TO clanplug_user;

-- Verify enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PostType');
