// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret';

import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { SystemHealthService } from '../service';
import { 
  ValidationError, 
  InternalError, 
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BadRequestError
} from '../../../modules/common/errors/graphql.error';

jest.mock('../../../config/logger');

describe('SystemHealthService', () => {
  let healthService: SystemHealthService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    Container.set(PrismaClient, prisma);
    healthService = Container.get(SystemHealthService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    jest.useRealTimers();
    // Clean up environment variables
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('checkHealth', () => {
    it('should perform basic health check', async () => {
      const result = await healthService.checkHealth({});
      
      expect(result).toEqual({
        status: 'ok',
        components: {
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
      const result = await healthService.checkHealth({ full: true });
      
      expect(result).toEqual({
        status: 'ok',
        components: {
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

    it('should check specific component', async () => {
      const result = await healthService.checkHealth({ component: 'database' });
      
      expect(result).toEqual({
        status: 'ok',
        components: {
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

      const promise = healthService.checkHealth({ 
        component: 'database',
        timeout: 100 
      });

      jest.advanceTimersByTime(150);
      const result = await promise;
      
      expect(result).toEqual({
        status: 'error',
        components: {
          database: {
            status: false,
            details: expect.stringContaining('Database check timed out'),
          },
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('simulateError', () => {
    it('should throw ValidationError', async () => {
      const error = await healthService.simulateError('VALIDATION').catch((e: Error) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation error test');
    });

    it('should throw AuthenticationError', async () => {
      const error = await healthService.simulateError('AUTHENTICATION').catch((e: Error) => e);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Authentication error test');
    });

    it('should throw AuthorizationError', async () => {
      const error = await healthService.simulateError('AUTHORIZATION').catch((e: Error) => e);
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe('Authorization error test');
    });

    it('should throw NotFoundError', async () => {
      const error = await healthService.simulateError('NOT_FOUND').catch((e: Error) => e);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Not found error test');
    });

    it('should throw BadRequestError', async () => {
      const error = await healthService.simulateError('BAD_REQUEST').catch((e: Error) => e);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error.message).toBe('Bad request error test');
    });

    it('should throw InternalError', async () => {
      const error = await healthService.simulateError('INTERNAL').catch((e: Error) => e);
      expect(error).toBeInstanceOf(InternalError);
      expect(error.message).toBe('Internal error test');
    });

    it('should throw InternalError for unknown type', async () => {
      const error = await healthService.simulateError('UNKNOWN').catch((e: Error) => e);
      expect(error).toBeInstanceOf(InternalError);
      expect(error.message).toBe('Internal error test');
    });

    it('should include correct status codes', async () => {
      const validationError = await healthService.simulateError('VALIDATION').catch((e: Error) => e);
      expect((validationError as ValidationError).status).toBe(400);

      const authError = await healthService.simulateError('AUTHENTICATION').catch((e: Error) => e);
      expect((authError as AuthenticationError).status).toBe(401);

      const forbiddenError = await healthService.simulateError('AUTHORIZATION').catch((e: Error) => e);
      expect((forbiddenError as AuthorizationError).status).toBe(403);

      const notFoundError = await healthService.simulateError('NOT_FOUND').catch((e: Error) => e);
      expect((notFoundError as NotFoundError).status).toBe(404);

      const internalError = await healthService.simulateError('INTERNAL').catch((e: Error) => e);
      expect((internalError as InternalError).status).toBe(500);
    });

    it('should include timestamp in extensions', async () => {
      const error = await healthService.simulateError('VALIDATION').catch((e: Error) => e);
      const timestamp = (error as ValidationError).extensions.timestamp;
      expect(timestamp).toBeDefined();
      expect(typeof timestamp === 'string' && new Date(timestamp).getTime()).not.toBeNaN();
    });
  });
}); 