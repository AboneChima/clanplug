import { Request, Response } from 'express';
import { getFileUrl } from '../services/local-storage.service';

export const uploadController = {
  /**
   * Upload single file
   */
  uploadSingle(req: Request, res: Response): void {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const fileUrl = getFileUrl(req.file.path);

      res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  },

  /**
   * Upload multiple files
   */
  uploadMultiple(req: Request, res: Response): void {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
        return;
      }

      const files = req.files.map((file: Express.Multer.File) => ({
        url: getFileUrl(file.path),
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      }));

      res.json({
        success: true,
        data: files
      });
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  }
};
