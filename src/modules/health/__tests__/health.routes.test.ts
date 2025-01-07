import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { Container } from 'typedi';
import { createHealthRoutes } from '../health.routes';
import { HealthService } from '../health.service';
import { HealthController } from '../health.controller';
import { PrismaClient } from '@prisma/client';
import { json } from 'body-parser';
import { ErrorService } from '../../common/errors/error.service';

describe('Health Routes', () => {
  let app: express.Application;
  let healthService: HealthService;
  let prisma: PrismaClient;
  let errorService: ErrorService;

  beforeAll(async () => {
    // 设置依赖
    prisma = new PrismaClient();
    errorService = new ErrorService();

    Container.reset();  // 重置容器
    Container.set(PrismaClient, prisma);
    Container.set(ErrorService, errorService);
    Container.set(HealthService, new HealthService(prisma));

    const healthController = new HealthController(Container.get(HealthService));

    // 设置 Express 应用
    app = express();
    app.use(json());
    app.use('/api/v1/health', createHealthRoutes(healthController));

    // 错误处理中间件
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (err.status) {
        res.status(err.status).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('GET /', () => {
    it('should return 200 for basic health check', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        checks: expect.any(Object),
        timestamp: expect.any(String),
      });
    });

    it('should return 200 for full health check', async () => {
      const response = await request(app)
        .get('/api/v1/health?full=true')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        checks: expect.any(Object),
        timestamp: expect.any(String),
      });
      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks).toHaveProperty('disk');
    });

    it('should return 200 for specific service check', async () => {
      const response = await request(app)
        .get('/api/v1/health?service=database')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        checks: {
          database: expect.any(Object),
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /test-error', () => {
    it('should handle SERVICE error', async () => {
      const response = await request(app)
        .get('/api/v1/health/test-error?type=SERVICE')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Service Error');
    });

    it('should handle VALIDATION error', async () => {
      const response = await request(app)
        .get('/api/v1/health/test-error?type=VALIDATION')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid input data');
    });

    it('should handle unknown error type', async () => {
      const response = await request(app)
        .get('/api/v1/health/test-error?type=UNKNOWN')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unknown error type');
    });
  });
}); 