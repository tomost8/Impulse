import { z } from 'zod';

/**
 * Represents the result of a single health check operation
 * 
 * @interface HealthCheckResult
 * @property {boolean} status - The status of the health check (true = healthy, false = unhealthy)
 * @property {string} [details] - Optional details about the health check result
 * 
 * @example
 * ```typescript
 * const result: HealthCheckResult = {
 *   status: true,
 *   details: "Database connection is healthy"
 * };
 * ```
 */
export interface HealthCheckResult {
  status: boolean;
  details?: string;
}

/**
 * Represents the complete health check response
 * 
 * @interface HealthCheckResponse
 * @property {'ok' | 'error'} status - Overall status of the health check
 * @property {Record<string, HealthCheckResult>} checks - Individual health check results for each service
 * @property {string} timestamp - ISO timestamp of when the health check was performed
 * 
 * @example
 * ```typescript
 * const response: HealthCheckResponse = {
 *   status: 'ok',
 *   checks: {
 *     database: { status: true },
 *     redis: { status: true, details: "Connected" }
 *   },
 *   timestamp: new Date().toISOString()
 * };
 * ```
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  checks: Record<string, HealthCheckResult>;
  timestamp: string;
}

/**
 * Options for customizing health check behavior
 * 
 * @interface HealthCheckOptions
 * @property {boolean} [full] - Whether to perform a full health check of all services
 * @property {string} [service] - Name of a specific service to check
 * @property {number} [timeout] - Timeout in milliseconds for the health check
 * 
 * @example
 * ```typescript
 * const options: HealthCheckOptions = {
 *   full: true,
 *   timeout: 5000
 * };
 * ```
 */
export interface HealthCheckOptions {
  full?: boolean;
  service?: string;
  timeout?: number;
}

/**
 * Interface defining the health check service contract
 * 
 * @interface IHealthCheck
 */
export interface IHealthCheck {
  /**
   * Performs a health check based on the provided options
   * 
   * @param {HealthCheckOptions} options - Options to customize the health check
   * @returns {Promise<HealthCheckResponse>} The health check results
   * 
   * @throws {ValidationError} When invalid options are provided
   * @throws {TimeoutError} When the health check times out
   */
  performHealthCheck(options: HealthCheckOptions): Promise<HealthCheckResponse>;

  /**
   * Test endpoint to simulate various error scenarios
   * 
   * @param {string} type - Type of error to simulate
   * @returns {Promise<never>} Never resolves, always throws an error
   * 
   * @throws {Error} Various error types based on the input
   */
  testError(type: string): Promise<never>;
} 