import { Service } from 'typedi';
import { HealthService } from './health.service';
import { HealthCheckOptions, HealthCheckResponse } from './health.types';

/**
 * Controller handling health check endpoints
 * 
 * This controller provides REST endpoints for system health monitoring,
 * including basic health checks and detailed system status information.
 * 
 * @remarks
 * The health check endpoints are designed to be used by monitoring systems
 * and load balancers to determine the health of the application.
 * 
 * @example
 * ```typescript
 * const controller = Container.get(HealthController);
 * const health = await controller.checkHealth({ full: true });
 * ```
 */
@Service()
export class HealthController {
  constructor(private healthService: HealthService) {}

  /**
   * Performs a health check of the system
   * 
   * @param {HealthCheckOptions} options - Options to customize the health check
   * @returns {Promise<HealthCheckResponse>} Health check results
   * 
   * @example
   * ```typescript
   * // Basic health check
   * const health = await controller.checkHealth({});
   * 
   * // Full health check with timeout
   * const fullHealth = await controller.checkHealth({
   *   full: true,
   *   timeout: 5000
   * });
   * 
   * // Check specific service
   * const dbHealth = await controller.checkHealth({
   *   service: 'database'
   * });
   * ```
   */
  async checkHealth(options: HealthCheckOptions): Promise<HealthCheckResponse> {
    return this.healthService.performHealthCheck(options);
  }

  /**
   * Test endpoint for error handling
   * 
   * This endpoint is used to test different error scenarios
   * and verify error handling mechanisms.
   * 
   * @param {string} type - Type of error to simulate
   * @returns {Promise<never>} Never resolves, always throws an error
   * 
   * @example
   * ```typescript
   * try {
   *   await controller.testError('VALIDATION');
   * } catch (error) {
   *   // Handle validation error
   * }
   * ```
   */
  async testError(type: string): Promise<never> {
    return this.healthService.testError(type);
  }
} 