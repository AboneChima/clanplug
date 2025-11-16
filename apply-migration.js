const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://lordmoon:LzJr3MUNrSoX4eb7k2D9eKviJpQTMXOm@dpg-d4b12124d50c73cv58bg-a.oregon-postgres.render.com/lordmoon',
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check existing tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log('📋 Existing tables:', tables.rows.map(r => r.table_name));

    // Add listingId column
    await client.query(`
      ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "listingId" TEXT;
    `);
    console.log('✅ Added listingId column to posts table');

    // Check if enum type exists
    const enumCheck = await client.query(`
      SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostType');
    `);
    
    if (enumCheck.rows[0].exists) {
      // Add MARKETPLACE_LISTING to PostType enum
      await client.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type t 
                         JOIN pg_enum e ON t.oid = e.enumtypid  
                         WHERE t.typname = 'PostType' AND e.enumlabel = 'MARKETPLACE_LISTING') THEN
            ALTER TYPE "PostType" ADD VALUE 'MARKETPLACE_LISTING';
          END IF;
        END $$;
      `);
      console.log('✅ Added MARKETPLACE_LISTING to PostType enum');
    } else {
      console.log('⚠️ PostType enum does not exist, skipping enum update');
    }

    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS "posts_listingId_idx" ON "posts"("listingId");
    `);
    console.log('✅ Created index on listingId');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

applyMigration();
