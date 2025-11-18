/**
 * Error Handling Middleware
 * Centralized error handling for Express
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Error handling middleware
 * Catches all errors and returns appropriate responses
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  if (err instanceof AppError) {
    if (err.isOperational) {
      logger.warn('Operational error occurred', {
        message: err.message,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
      });
    } else {
      logger.error('Non-operational error occurred', err);
    }
  } else {
    logger.error('Unexpected error occurred', err);
  }

  // Send error response
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
  } else {
    // Don't leak internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: 'Internal server error',
      ...(isDevelopment && { details: err.message }),
    });
  }
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

