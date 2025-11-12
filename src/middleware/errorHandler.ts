import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import config from '../config/config';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public data?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    data?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
export class ValidationError extends AppError {
  constructor(message: string, errors?: any) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

// Authentication error class
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// Authorization error class
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Not found error class
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

// Conflict error class
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

// Rate limit error class
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// Handle Prisma errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[] | undefined;
      const fieldName = field ? field[0] : 'field';
      return new ConflictError(`${fieldName} already exists`);

    case 'P2025':
      // Record not found
      return new NotFoundError('Record not found');

    case 'P2003':
      // Foreign key constraint violation
      return new ValidationError('Invalid reference to related record');

    case 'P2014':
      // Required relation violation
      return new ValidationError('Required relation is missing');

    case 'P2021':
      // Table does not exist
      return new AppError('Database table does not exist', 500, 'DATABASE_ERROR');

    case 'P2022':
      // Column does not exist
      return new AppError('Database column does not exist', 500, 'DATABASE_ERROR');

    default:
      return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};

// Handle validation errors
const handleValidationError = (error: any): ValidationError => {
  if (error.details) {
    // Joi validation error
    const errors = error.details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    return new ValidationError('Validation failed', errors);
  }

  if (error.errors) {
    // Express-validator errors
    const errors = error.errors.map((err: any) => ({
      field: err.param || err.path,
      message: err.msg,
      value: err.value
    }));
    return new ValidationError('Validation failed', errors);
  }

  return new ValidationError(error.message || 'Validation failed');
};

// Main error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Handle different types of errors
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new ValidationError('Invalid data provided');
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    appError = new AppError('Database connection failed', 500, 'DATABASE_CONNECTION_ERROR');
  } else if (error.name === 'ValidationError') {
    appError = handleValidationError(error);
  } else if (error.name === 'CastError') {
    appError = new ValidationError('Invalid data format');
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    appError = new AuthenticationError('Token expired');
  } else if (error.name === 'MulterError') {
    appError = new ValidationError(`File upload error: ${error.message}`);
  } else {
    // Unknown error
    appError = new AppError(
      config.isProduction ? 'Something went wrong' : error.message,
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log error details
  console.error('Error occurred:', {
    message: appError.message,
    statusCode: appError.statusCode,
    code: appError.code,
    stack: config.isDevelopment ? appError.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Send error response
  const response: any = {
    success: false,
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode
  };

  // Include additional data if available
  if (appError.data) {
    response.data = appError.data;
  }

  // Include stack trace in development
  if (config.isDevelopment && appError.stack) {
    response.stack = appError.stack;
  }

  // Include request ID for tracking
  if (req.headers['x-request-id']) {
    response.requestId = req.headers['x-request-id'];
  }

  res.status(appError.statusCode).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};