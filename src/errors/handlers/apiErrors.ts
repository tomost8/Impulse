import { Request, Response, NextFunction, Application } from 'express';
import { AppError, ServiceError } from '../types/AppError';
import { env } from '../../config/env';
import logger from '../../utils/logger';
import { ERROR_MESSAGES, HTTP_STATUS} from '../../constants/index';

export const apiErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err instanceof AppError) {
    const response = {
      status: 'error',
      message: err.message,
      ...(err instanceof ServiceError && { details: err.details }),
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    };
    return res.status(err.statusCode).json(response);
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER).json({
    status: 'error',
    message: ERROR_MESSAGES.SERVER_ERROR,
    ...(env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
};

export const setupApiErrorHandlers = (app: Application) => {
  // 404 handler
  app.use((req, res, next) => {
    next(new AppError(404, `Route ${req.originalUrl} not found`));
  });

  // Error handling middleware
  app.use(apiErrorHandler);
};