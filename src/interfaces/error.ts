import { Request } from 'express';
import { AppError } from '../types/AppError';

export interface IErrorHandler {
  handleUncaughtException(error: Error): void;
  handleUnhandledRejection(reason: any): void;
  handleHttpError(error: Error | AppError, req: Request): IErrorResponse;
}

export interface IErrorResponse {
  status: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  statusCode: number;
} 