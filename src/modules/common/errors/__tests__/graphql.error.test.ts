import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BadRequestError,
  InternalError,
  ErrorCode,
} from '../graphql.error';

describe('GraphQL Errors', () => {
  it('should create ValidationError with correct properties', () => {
    const message = 'Invalid input';
    const details = { field: 'email', reason: 'invalid format' };
    const error = new ValidationError(message, details);

    expect(error.message).toBe(message);
    expect(error.extensions.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.extensions.details).toEqual(details);
    expect(error.extensions.timestamp).toBeDefined();
  });

  it('should create AuthenticationError with correct properties', () => {
    const error = new AuthenticationError();
    expect(error.message).toBe('Not authenticated');
    expect(error.extensions.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
    expect(error.extensions.timestamp).toBeDefined();

    const customMessage = 'Custom auth error';
    const errorWithCustomMessage = new AuthenticationError(customMessage);
    expect(errorWithCustomMessage.message).toBe(customMessage);
  });

  it('should create AuthorizationError with correct properties', () => {
    const error = new AuthorizationError();
    expect(error.message).toBe('Not authorized');
    expect(error.extensions.code).toBe(ErrorCode.AUTHORIZATION_ERROR);
    expect(error.extensions.timestamp).toBeDefined();

    const customMessage = 'Custom auth error';
    const errorWithCustomMessage = new AuthorizationError(customMessage);
    expect(errorWithCustomMessage.message).toBe(customMessage);
  });

  it('should create NotFoundError with correct properties', () => {
    const message = 'User not found';
    const error = new NotFoundError(message);

    expect(error.message).toBe(message);
    expect(error.extensions.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.extensions.timestamp).toBeDefined();
  });

  it('should create BadRequestError with correct properties', () => {
    const message = 'Bad request';
    const details = { reason: 'missing required field' };
    const error = new BadRequestError(message, details);

    expect(error.message).toBe(message);
    expect(error.extensions.code).toBe(ErrorCode.BAD_REQUEST);
    expect(error.extensions.details).toEqual(details);
    expect(error.extensions.timestamp).toBeDefined();
  });

  it('should create InternalError with correct properties', () => {
    const error = new InternalError();
    expect(error.message).toBe('Internal server error');
    expect(error.extensions.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.extensions.timestamp).toBeDefined();

    const customMessage = 'Custom internal error';
    const errorWithCustomMessage = new InternalError(customMessage);
    expect(errorWithCustomMessage.message).toBe(customMessage);
  });
}); 