import 'reflect-metadata';
import request from 'supertest';
import express from 'express';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { HealthController } from '../controller';
import { createHealthRoutes } from '../routes';
import { SystemHealthResponse } from '../interfaces';

describe('Health Routes', () => {
  let app: express.Application;
  let healthController: DeepMockProxy<HealthController>;

  beforeAll(() => {
    healthController = mockDeep<HealthController>();
    app = express();
    app.use('/health', createHealthRoutes(healthController));
    // Error handling
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(500).json({ error: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health check results', async () => {
      // Arrange
      const mockResponse: SystemHealthResponse = {
        status: 'ok',
        components: {
          database: { status: true }
        },
        timestamp: new Date().toISOString()
      };
      healthController.checkHealth.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Assert
      expect(response.body).toEqual(mockResponse);
      expect(healthController.checkHealth).toHaveBeenCalledWith({
        full: false,
        component: undefined,
        timeout: undefined
      });
    });

    it('should handle query parameters', async () => {
      // Arrange
      const mockResponse: SystemHealthResponse = {
        status: 'ok',
        components: {
          database: { status: true }
        },
        timestamp: new Date().toISOString()
      };
      healthController.checkHealth.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app)
        .get('/health')
        .query({
          full: 'true',
          component: 'database',
          timeout: '5000'
        })
        .expect(200);

      // Assert
      expect(healthController.checkHealth).toHaveBeenCalledWith({
        full: true,
        component: 'database',
        timeout: 5000
      });
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Service error');
      healthController.checkHealth.mockRejectedValue(error);

      // Act
      await request(app)
        .get('/health')
        .expect(500);
    });
  });

  describe('GET /health/test-error', () => {
    it('should simulate error', async () => {
      // Arrange
      const error = new Error('Test error');
      healthController.simulateError.mockRejectedValue(error);

      // Act
      await request(app)
        .get('/health/test-error')
        .query({ type: 'TEST' })
        .expect(500);

      // Assert
      expect(healthController.simulateError).toHaveBeenCalledWith('TEST');
    });

    it('should use default error type', async () => {
      // Arrange
      const error = new Error('Test error');
      healthController.simulateError.mockRejectedValue(error);

      // Act
      await request(app)
        .get('/health/test-error')
        .expect(500);

      // Assert
      expect(healthController.simulateError).toHaveBeenCalledWith('UNCAUGHT');
    });
  });
}); 