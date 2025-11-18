import { Router } from 'express';
import { migrationController } from '../controllers/migration.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /api/migration/create-bookmarks-table
router.post('/create-bookmarks-table', asyncHandler(migrationController.createBookmarksTable));

export default router;
