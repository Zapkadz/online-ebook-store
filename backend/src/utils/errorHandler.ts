import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  const response: ErrorResponse = {
    success: false,
    message: 'Internal Server Error'
  };

  // Handle specific error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    response.message = 'Validation Error';
    response.errors = err.errors;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    response.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    response.message = 'Token expired';
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  } else {
    logger.error(`${err.name}: ${err.message}`);
  }

  res.status(statusCode).json(response);
};

// Error handlers for specific scenarios
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(404, `Resource not found - ${req.originalUrl}`);
  next(error);
};

export const asyncHandler = 
  <T extends (...args: any[]) => Promise<any>>(fn: T) =>
  (...args: Parameters<T>): Promise<ReturnType<T>> =>
    Promise.resolve(fn(...args)).catch(args[2]);

// Custom error types
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

// Database error handler
export const handleDatabaseError = (error: any) => {
  logger.error('Database Error:', error);
  
  if (error.code === 'ER_DUP_ENTRY') {
    throw new ConflictError('Duplicate entry');
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW') {
    throw new ValidationError('Invalid reference');
  }
  
  throw new AppError(500, 'Database error occurred');
};