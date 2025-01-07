import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { HealthService } from '../health.service';
import { ValidationError, InternalError } from '../../common/errors/graphql.error';

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
          disk: { status: true },
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
    it('should throw SERVICE error', async () => {
      await expect(healthService.testError('SERVICE'))
        .rejects
        .toThrow(InternalError);
    });

    it('should throw VALIDATION error', async () => {
      await expect(healthService.testError('VALIDATION'))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw DATABASE error', async () => {
      await expect(healthService.testError('DATABASE'))
        .rejects
        .toThrow(InternalError);
    });

    it('should throw default error for unknown type', async () => {
      await expect(healthService.testError('UNKNOWN'))
        .rejects
        .toThrow(InternalError);
    });
  });
}); 