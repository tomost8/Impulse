import { Request, Response, NextFunction, Application } from 'express';
import { AppError } from '../core/AppError';
import { ErrorService } from '../services/errorService';

const errorService = new ErrorService();

export const apiErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errorResponse = errorService.handleHttpError(err, req);
  res.status(errorResponse.statusCode).json(errorResponse);
};

export const setupApiErrorHandlers = (app: Application) => {
  // 404 handler
  app.use((req, res, next) => {
    next(new AppError(404, `Route ${req.originalUrl} not found`));
  });

  // Error handling middleware
  app.use(apiErrorHandler);
}; 