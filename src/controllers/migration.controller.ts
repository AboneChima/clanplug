import { Request, Response } from 'express';
import { prisma } from '../config/database';

class MigrationController {
  // POST /api/migration/create-bookmarks-table
  async createBookmarksTable(req: Request, res: Response): Promise<void> {
    try {
      const { secret } = req.body;
      
      // Security check
      if (secret !== 'create-bookmarks-table-2024') {
        res.status(403).json({
          success: false,
          message: 'Invalid secret',
        });
        return;
      }

      // Try to create a test bookmark to verify table exists
      try {
        const testCount = await prisma.bookmark.count();
        res.json({
          success: true,
          message: `Bookmarks table already exists with ${testCount} bookmarks`,
        });
        return;
      } catch (error: any) {
        // Table doesn't exist, need to create it
        console.log('Bookmarks table does not exist, creating...');
      }

      // Execute raw SQL to create the table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "bookmarks" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "postId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "bookmarks_userId_postId_key" UNIQUE ("userId", "postId")
        );
      `;

      // Add foreign key constraints
      await prisma.$executeRaw`
        ALTER TABLE "bookmarks" 
        ADD CONSTRAINT "bookmarks_postId_fkey" 
        FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;

      await prisma.$executeRaw`
        ALTER TABLE "bookmarks" 
        ADD CONSTRAINT "bookmarks_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;

      res.json({
        success: true,
        message: 'Bookmarks table created successfully',
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create bookmarks table',
        error: error.message,
      });
    }
  }
}

export const migrationController = new MigrationController();
