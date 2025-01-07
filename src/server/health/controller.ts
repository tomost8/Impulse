import { Service } from 'typedi';
import { SystemHealthService } from './service';
import { HealthCheckConfig, SystemHealthResponse } from './interfaces';

/**
 * Controller handling health check endpoints
 * 
 * Provides REST endpoints for system health monitoring,
 * including basic health checks and detailed system status information.
 */
@Service()
export class HealthController {
  constructor(private healthService: SystemHealthService) {}

  /**
   * Perform system health check
   * 
   * @param {HealthCheckConfig} config - Configuration for the health check
   * @returns {Promise<SystemHealthResponse>} Health check results
   */
  async checkHealth(config: HealthCheckConfig): Promise<SystemHealthResponse> {
    return this.healthService.checkHealth(config);
  }

  /**
   * Test endpoint for error handling
   * 
   * @param {string} scenario - Type of error to simulate
   * @returns {Promise<never>} Never resolves, always throws an error
   */
  async simulateError(scenario: string): Promise<never> {
    return this.healthService.simulateError(scenario);
  }
} 