/**
 * Health check result for a single component
 */
export interface ComponentHealth {
  status: boolean;
  details?: string;
}

/**
 * System health status response
 */
export interface SystemHealthResponse {
  status: 'ok' | 'error';
  components: Record<string, ComponentHealth>;
  timestamp: string;
}

/**
 * Health check configuration options
 */
export interface HealthCheckConfig {
  full?: boolean;
  component?: string;
  timeout?: number;
}

/**
 * Health monitor service interface
 */
export interface HealthMonitor {
  /**
   * Check system health status
   * 
   * @param {HealthCheckConfig} config - Configuration for the health check
   * @returns {Promise<SystemHealthResponse>} The health check results
   * 
   * @throws {ValidationError} When invalid config is provided
   * @throws {TimeoutError} When the health check times out
   */
  checkHealth(config: HealthCheckConfig): Promise<SystemHealthResponse>;

  /**
   * Simulate error scenarios for testing
   * 
   * @param {string} scenario - Type of error to simulate
   * @returns {Promise<never>} Never resolves, always throws an error
   * 
   * @throws {Error} Various error types based on the input
   */
  simulateError(scenario: string): Promise<never>;
} 