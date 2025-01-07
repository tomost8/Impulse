import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { HealthService } from '../health.service';
import { 
  ValidationError, 
  InternalError, 
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BadRequestError
} from '../../common/errors/graphql.error';

jest.mock('../../../config/logger');

describe('HealthService', () => {
  let healthService: HealthService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    Container.set(PrismaClient, prisma);
    healthService = Container.get(HealthService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('performHealthCheck', () => {
    it('should perform basic health check', async () => {
      const result = await healthService.performHealthCheck({});
      
      expect(result).toEqual({
        status: 'ok',
        checks: {
          database: { status: true },
          redis: { status: true },
          server: expect.objectContaining({
            status: true,
            details: expect.stringContaining('Server uptime:'),
          }),
        },
        timestamp: expect.any(String),
      });
    });

    it('should perform full health check', async () => {
      const result = await healthService.performHealthCheck({ full: true });
      
      expect(result).toEqual({
        status: 'ok',
        checks: {
          database: { status: true },
          redis: { status: true },
          server: expect.objectContaining({
            status: true,
            details: expect.stringContaining('Server uptime:'),
          }),
          externalApi: { status: true },
          messageQueue: { status: true },
          memory: expect.objectContaining({
            status: true,
            details: expect.stringContaining('Memory usage:'),
          }),
          disk: expect.objectContaining({
            status: true,
            details: expect.stringContaining('Disk usage:'),
          }),
        },
        timestamp: expect.any(String),
      });
    });

    it('should check specific service', async () => {
      const result = await healthService.performHealthCheck({ service: 'database' });
      
      expect(result).toEqual({
        status: 'ok',
        checks: {
          database: { status: true },
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle database timeout', async () => {
      const mockQueryRaw = jest.spyOn(prisma, '$queryRaw');
      mockQueryRaw.mockReturnValueOnce(
        new Promise(resolve => {
          setTimeout(() => resolve(null), 1000);
        }) as any
      );

      const promise = healthService.performHealthCheck({ 
        service: 'database',
        timeout: 100 
      });

      jest.advanceTimersByTime(150);
      const result = await promise;
      
      expect(result).toEqual({
        status: 'error',
        checks: {
          database: {
            status: false,
            details: expect.stringContaining('Database check timed out'),
          },
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('testError', () => {
    it('should throw ValidationError', async () => {
      const error = await healthService.testError('VALIDATION').catch(e => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid input data');
      expect(error.extensions.details).toEqual({
        field: 'email',
        constraint: 'format'
      });
    });

    it('should throw AuthenticationError', async () => {
      const error = await healthService.testError('AUTHENTICATION').catch(e => e);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Invalid or expired token');
    });

    it('should throw AuthorizationError', async () => {
      const error = await healthService.testError('AUTHORIZATION').catch(e => e);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe('Insufficient permissions');
    });

    it('should throw NotFoundError', async () => {
      const error = await healthService.testError('NOT_FOUND').catch(e => e);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Resource not found');
    });

    it('should throw BadRequestError', async () => {
      const error = await healthService.testError('BAD_REQUEST').catch(e => e);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Invalid request parameters');
      expect(error.extensions.details).toEqual({
        param: 'id',
        reason: 'must be a number'
      });
    });

    it('should throw InternalError', async () => {
      const error = await healthService.testError('INTERNAL').catch(e => e);
      expect(error).toBeInstanceOf(InternalError);
      expect(error.message).toBe('Unexpected server error');
    });

    it('should throw InternalError for unknown type', async () => {
      const error = await healthService.testError('UNKNOWN').catch(e => e);
      expect(error).toBeInstanceOf(InternalError);
      expect(error.message).toBe('Unknown error type');
    });

    it('should include correct status codes', async () => {
      const validationError = await healthService.testError('VALIDATION').catch(e => e);
      expect(validationError.status).toBe(400);

      const authError = await healthService.testError('AUTHENTICATION').catch(e => e);
      expect(authError.status).toBe(401);

      const forbiddenError = await healthService.testError('AUTHORIZATION').catch(e => e);
      expect(forbiddenError.status).toBe(403);

      const notFoundError = await healthService.testError('NOT_FOUND').catch(e => e);
      expect(notFoundError.status).toBe(404);

      const internalError = await healthService.testError('INTERNAL').catch(e => e);
      expect(internalError.status).toBe(500);
    });

    it('should include timestamp in extensions', async () => {
      const error = await healthService.testError('VALIDATION').catch(e => e);
      expect(error.extensions.timestamp).toBeDefined();
      expect(new Date(error.extensions.timestamp).getTime()).not.toBeNaN();
    });
  });
}); 