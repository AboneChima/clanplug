import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle, uploadMultiple } from '../services/local-storage.service';

const router = Router();

// Upload single file
router.post('/single', authenticate, uploadSingle, uploadController.uploadSingle);

// Upload multiple files
router.post('/multiple', authenticate, uploadMultiple, uploadController.uploadMultiple);

export default router;
