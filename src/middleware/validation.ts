import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('🚨 Validation errors:', JSON.stringify(errors.array(), null, 2));
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request path:', req.path);
    
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  
  next();
};