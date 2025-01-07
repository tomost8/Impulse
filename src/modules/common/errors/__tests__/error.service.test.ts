import 'reflect-metadata';
import { Container } from 'typedi';
import { GraphQLError } from 'graphql';
import { ErrorService } from '../error.service';
import { ValidationError, InternalError } from '../graphql.error';
import logger from '../../../../config/logger';

jest.mock('../../../../config/logger');

describe('ErrorService', () => {
  let errorService: ErrorService;
  let processExitSpy: jest.SpyInstance;

  beforeAll(() => {
    errorService = new ErrorService();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      return undefined as never;
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    processExitSpy.mockRestore();
  });

  describe('handleUncaughtException', () => {
    it('should log uncaught exception with correct details', () => {
      const error = new Error('Test error');
      errorService.handleUncaughtException(error);

      expect(logger.error).toHaveBeenCalledWith('Uncaught Exception:', expect.objectContaining({
        message: error.message,
        stack: error.stack,
        timestamp: expect.any(String),
        processId: expect.any(Number),
        nodeVersion: expect.any(String),
        memoryUsage: expect.any(Object),
      }));
    });
  });

  describe('handleUnhandledRejection', () => {
    it('should log unhandled rejection with correct details', () => {
      const reason = new Error('Test rejection');
      errorService.handleUnhandledRejection(reason);

      expect(logger.error).toHaveBeenCalledWith('Unhandled Rejection:', expect.objectContaining({
        reason,
        stack: reason.stack,
        timestamp: expect.any(String),
        processId: expect.any(Number),
        nodeVersion: expect.any(String),
        memoryUsage: expect.any(Object),
      }));
    });
  });

  describe('formatError', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = process.env;
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return known GraphQL errors as-is', () => {
      const error = new ValidationError('Invalid input');
      const formattedError = errorService.formatError(error);
      expect(formattedError).toBe(error);
    });

    it('should convert unknown errors to InternalError in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new GraphQLError('Test error');
      const formattedError = errorService.formatError(error);

      expect(formattedError).toBeInstanceOf(InternalError);
      expect(formattedError.message).toBe('Internal server error');
      expect((formattedError.extensions as any).originalError).toBeUndefined();
    });

    it('should include original error details in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new GraphQLError('Test error');
      const formattedError = errorService.formatError(error);

      expect(formattedError).toBeInstanceOf(InternalError);
      expect(formattedError.message).toBe('Test error');
      expect((formattedError.extensions as any).originalError).toBeDefined();
      expect((formattedError.extensions as any).originalError.message).toBe('Test error');
    });

    it('should log GraphQL errors', () => {
      const error = new GraphQLError('Test error');
      errorService.formatError(error);

      expect(logger.error).toHaveBeenCalledWith('GraphQL Error:', expect.objectContaining({
        message: error.message,
        path: error.path,
        locations: error.locations,
        extensions: error.extensions,
      }));
    });
  });
}); 