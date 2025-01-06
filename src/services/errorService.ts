import { Request } from 'express';
import { IErrorHandler, IErrorResponse } from '../interfaces/error';
import { AppError, ServiceError } from '../types/AppError';
import { ERROR_MESSAGES, HTTP_STATUS } from '../constants';
import { env } from '../config/env';
import logger from '../utils/logger';

export class ErrorService implements IErrorHandler {
  handleUncaughtException(error: Error): void {
    logger.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      processId: process.pid,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    });
  }

  handleUnhandledRejection(reason: any): void {
    logger.error('Unhandled Rejection:', {
      reason,
      stack: reason?.stack,
      timestamp: new Date().toISOString(),
      processId: process.pid,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    });
  }

  handleHttpError(error: Error | AppError, req: Request): IErrorResponse {
    logger.error('HTTP Error:', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });

    if (error instanceof AppError) {
      return {
        status: 'error',
        message: error.message,
        statusCode: error.statusCode,
        ...(error instanceof ServiceError && { details: error.details }),
        ...(env.NODE_ENV === 'development' && { stack: error.stack })
      };
    }

    return {
      status: 'error',
      message: ERROR_MESSAGES.SERVER_ERROR,
      statusCode: HTTP_STATUS.INTERNAL_SERVER,
      ...(env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    };
  }
} 