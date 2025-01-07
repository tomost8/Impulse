import 'reflect-metadata';
import { Container } from 'typedi';
import { HealthController } from '../controller';
import { SystemHealthService } from '../service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: DeepMockProxy<SystemHealthService>;

  beforeAll(() => {
    healthService = mockDeep<SystemHealthService>();
    Container.set(SystemHealthService, healthService);
    controller = Container.get(HealthController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('should return health check results', async () => {
      // Arrange
      const mockResponse = {
        status: 'ok' as const,
        components: {
          database: { status: true }
        },
        timestamp: new Date().toISOString()
      };
      healthService.checkHealth.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.checkHealth({});

      // Assert
      expect(result).toEqual(mockResponse);
      expect(healthService.checkHealth).toHaveBeenCalledWith({});
    });

    it('should pass configuration to service', async () => {
      // Arrange
      const config = {
        full: true,
        component: 'database',
        timeout: 5000
      };
      const mockResponse = {
        status: 'ok' as const,
        components: {
          database: { status: true }
        },
        timestamp: new Date().toISOString()
      };
      healthService.checkHealth.mockResolvedValue(mockResponse);

      // Act
      await controller.checkHealth(config);

      // Assert
      expect(healthService.checkHealth).toHaveBeenCalledWith(config);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Service error');
      healthService.checkHealth.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.checkHealth({})).rejects.toThrow(error);
    });
  });

  describe('simulateError', () => {
    it('should pass error type to service', async () => {
      // Arrange
      const error = new Error('Test error');
      healthService.simulateError.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.simulateError('TEST')).rejects.toThrow(error);
      expect(healthService.simulateError).toHaveBeenCalledWith('TEST');
    });
  });
}); 