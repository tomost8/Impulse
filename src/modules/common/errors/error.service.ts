import { Service } from 'typedi';
import logger from '../../../config/logger';
import { GraphQLFormattedError, GraphQLError } from 'graphql';
import { InternalError } from './graphql.error';

@Service()
export class ErrorService {
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

  formatError(error: GraphQLError): GraphQLError {
    logger.error('GraphQL Error:', {
      message: error.message,
      path: error.path,
      locations: error.locations,
      extensions: error.extensions,
    });

    // 如果是已知的 GraphQL 错误，直接返回
    if (error instanceof GraphQLError && error.extensions?.code) {
      return error;
    }

    // 未知错误，转换为内部错误
    const internalError = new InternalError(
      process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message
    );

    // 在开发环境下添加原始错误信息
    if (process.env.NODE_ENV === 'development') {
      Object.assign(internalError.extensions, {
        originalError: {
          message: error.message,
          stack: error.stack,
        },
      });
    }

    return internalError;
  }
} 