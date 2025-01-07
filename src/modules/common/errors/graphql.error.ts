import { GraphQLError } from 'graphql';
import logger from '../../../config/logger';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class BaseGraphQLError extends GraphQLError {
  status: number;

  constructor(
    message: string,
    code: ErrorCode,
    status: number = 500,
    extensions?: Record<string, any>
  ) {
    const timestamp = new Date().toISOString();
    super(message, {
      extensions: {
        code,
        timestamp,
        ...extensions,
      },
    });
    this.status = status;

    // 记录错误创建
    logger.error('GraphQL error created', {
      message,
      code,
      status,
      timestamp,
      extensions
    });
  }
}

export class ValidationError extends BaseGraphQLError {
  constructor(message: string, details?: Record<string, any>) {
    logger.debug('Creating validation error', { message, details });
    super(message, ErrorCode.VALIDATION_ERROR, 400, { details });
  }
}

export class AuthenticationError extends BaseGraphQLError {
  constructor(message: string = 'Not authenticated') {
    logger.debug('Creating authentication error', { message });
    super(message, ErrorCode.AUTHENTICATION_ERROR, 401);
  }
}

export class AuthorizationError extends BaseGraphQLError {
  constructor(message: string = 'Not authorized') {
    logger.debug('Creating authorization error', { message });
    super(message, ErrorCode.AUTHORIZATION_ERROR, 403);
  }
}

export class NotFoundError extends BaseGraphQLError {
  constructor(message: string) {
    logger.debug('Creating not found error', { message });
    super(message, ErrorCode.NOT_FOUND, 404);
  }
}

export class BadRequestError extends BaseGraphQLError {
  constructor(message: string, details?: Record<string, any>) {
    logger.debug('Creating bad request error', { message, details });
    super(message, ErrorCode.BAD_REQUEST, 400, { details });
  }
}

export class InternalError extends BaseGraphQLError {
  constructor(message: string = 'Internal server error') {
    logger.debug('Creating internal error', { message });
    super(message, ErrorCode.INTERNAL_ERROR, 500);
  }
} 