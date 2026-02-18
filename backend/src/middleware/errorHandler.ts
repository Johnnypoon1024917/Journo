import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * Logs errors with Winston and returns appropriate responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 server error
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Determine if it's a client error (4xx) or server error (5xx)
  const isClientError = statusCode >= 400 && statusCode < 500;
  const isServerError = statusCode >= 500;

  // Log error with context
  const errorLog = {
    message: err.message,
    statusCode,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  };

  // Log based on error type
  if (isServerError) {
    // Server errors are critical - log with full stack trace
    logger.error('Server error occurred', errorLog);
  } else if (isClientError) {
    // Client errors are less critical - log as warnings
    logger.warn('Client error occurred', {
      ...errorLog,
      stack: undefined, // Don't log stack trace for client errors
    });
  } else {
    // Unknown status code
    logger.error('Unknown error occurred', errorLog);
  }

  // Send response
  const response: any = {
    error: message,
    statusCode,
  };

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  // Include request ID if available
  if (req.headers['x-request-id']) {
    response.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError(`Route not found: ${req.method} ${req.path}`, 404);
  next(error);
};
