import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { 
  ValidationError, 
  BadRequestError, 
  InternalError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} from '../common/errors/graphql.error';
import { 
  HealthCheckResult, 
  IHealthCheck, 
  HealthCheckOptions, 
  HealthCheckResponse 
} from './health.types';
import logger from '../../config/logger';
import { APP_CONSTANTS } from '../../config/env';
import * as os from 'os';
import * as fs from 'fs';

/**
 * Service responsible for performing health checks on various system components
 * 
 * This service implements the health check functionality for the application,
 * including database connectivity, Redis availability, and other system checks.
 * 
 * @implements {IHealthCheck}
 * 
 * @example
 * ```typescript
 * const healthService = Container.get(HealthService);
 * const health = await healthService.performHealthCheck({ full: true });
 * ```
 */
@Service()
export class HealthService implements IHealthCheck {
  constructor(private prisma: PrismaClient) {}

  /**
   * Checks the database connection health
   * 
   * Executes a simple query to verify database connectivity and
   * measures the response time.
   * 
   * @param {number} timeout - Maximum time to wait for database response
   * @returns {Promise<HealthCheckResult>} Database health check result
   * 
   * @example
   * ```typescript
   * const dbHealth = await healthService.checkDatabase(5000);
   * ```
   */
  private async checkDatabase(timeout: number = APP_CONSTANTS.HEALTH_CHECK_TIMEOUT): Promise<HealthCheckResult> {
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database check timed out')), timeout)
        ),
      ]);
      return { status: true };
    } catch (error) {
      return { 
        status: false,
        details: error instanceof Error ? error.message : 'Database check failed'
      };
    }
  }

  /**
   * Checks Redis connection health
   * 
   * @returns {Promise<HealthCheckResult>} Redis health check result
   * @todo Implement actual Redis health check
   */
  private async checkRedis(): Promise<HealthCheckResult> {
    // TODO: Add Redis health check
    return { status: true };
  }

  /**
   * Checks the server's health status
   * 
   * Includes information about server uptime and basic metrics
   * 
   * @returns {Promise<HealthCheckResult>} Server health check result
   */
  private async checkServer(): Promise<HealthCheckResult> {
    return {
      status: true,
      details: `Server uptime: ${process.uptime()} seconds`
    };
  }

  /**
   * Checks the health of external API dependencies
   * 
   * @returns {Promise<HealthCheckResult>} External API health check result
   * @todo Implement checks for external APIs
   */
  private async checkExternalApi(): Promise<HealthCheckResult> {
    // TODO: Add external API health check
    return { status: true };
  }

  /**
   * Checks the message queue health
   * 
   * @returns {Promise<HealthCheckResult>} Message queue health check result
   * @todo Implement actual message queue health check
   */
  private async checkMessageQueue(): Promise<HealthCheckResult> {
    // TODO: Add message queue health check
    return { status: true };
  }

  /**
   * Checks system memory usage
   * 
   * @returns {Promise<HealthCheckResult>} Memory health check result
   */
  private async checkMemory(): Promise<HealthCheckResult> {
    // Get process memory usage
    const processMemory = process.memoryUsage();
    const heapUsed = processMemory.heapUsed;
    const heapTotal = processMemory.heapTotal;
    const heapUsage = (heapUsed / heapTotal) * 100;

    // Get system memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const systemMemUsage = ((totalMem - freeMem) / totalMem) * 100;

    return {
      status: true, // Only alert based on heap usage
      details: `Memory usage: Heap ${heapUsage.toFixed(2)}% (${(heapUsed / 1024 / 1024).toFixed(2)}MB/${(heapTotal / 1024 / 1024).toFixed(2)}MB), System ${systemMemUsage.toFixed(2)}%`
    };
  }

  /**
   * Checks disk space usage
   * 
   * @returns {Promise<HealthCheckResult>} Disk health check result
   */
  private async checkDisk(): Promise<HealthCheckResult> {
    try {
      // Check root directory
      const stats = fs.statfsSync('/');
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;
      const usagePercent = (used / total) * 100;

      return {
        status: usagePercent < 90, // Alert if disk usage is above 90%
        details: `Disk usage: ${usagePercent.toFixed(2)}% (${(used / 1024 / 1024 / 1024).toFixed(2)} GB used)`
      };
    } catch (error) {
      return {
        status: false,
        details: error instanceof Error ? error.message : 'Disk check failed'
      };
    }
  }

  /**
   * Performs a comprehensive health check of the system
   * 
   * @param {HealthCheckOptions} options - Health check configuration options
   * @returns {Promise<HealthCheckResponse>} Complete health check results
   * 
   * @throws {ValidationError} When invalid options are provided
   * @throws {BadRequestError} When an invalid service name is specified
   * 
   * @example
   * ```typescript
   * // Full health check
   * const fullHealth = await healthService.performHealthCheck({ full: true });
   * 
   * // Check specific service
   * const dbHealth = await healthService.performHealthCheck({ service: 'database' });
   * ```
   */
  async performHealthCheck(options: HealthCheckOptions): Promise<HealthCheckResponse> {
    const { full = false, service, timeout = APP_CONSTANTS.HEALTH_CHECK_TIMEOUT } = options;
    const checks: Record<string, HealthCheckResult> = {};

    if (service) {
      switch (service) {
        case 'database':
          checks.database = await this.checkDatabase(timeout);
          break;
        case 'redis':
          checks.redis = await this.checkRedis();
          break;
        case 'server':
          checks.server = await this.checkServer();
          break;
        case 'memory':
          checks.memory = await this.checkMemory();
          break;
        case 'disk':
          checks.disk = await this.checkDisk();
          break;
        case 'externalApi':
          checks.externalApi = await this.checkExternalApi();
          break;
        case 'messageQueue':
          checks.messageQueue = await this.checkMessageQueue();
          break;
        default:
          throw new BadRequestError(`Unknown service: ${service}`);
      }
    } else if (full) {
      checks.database = await this.checkDatabase(timeout);
      checks.redis = await this.checkRedis();
      checks.server = await this.checkServer();
      checks.memory = await this.checkMemory();
      checks.disk = await this.checkDisk();
      checks.externalApi = await this.checkExternalApi();
      checks.messageQueue = await this.checkMessageQueue();
    } else {
      // Basic health check includes database, redis, and server
      checks.database = await this.checkDatabase(timeout);
      checks.redis = await this.checkRedis();
      checks.server = await this.checkServer();
    }

    const status = Object.values(checks).every(check => check.status) ? 'ok' : 'error';

    return {
      status,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test endpoint for error handling scenarios
   * 
   * @param {string} type - Type of error to simulate
   * @returns {Promise<never>} Never resolves, always throws an error
   * 
   * @throws {ValidationError} When type is 'VALIDATION'
   * @throws {AuthenticationError} When type is 'AUTHENTICATION'
   * @throws {AuthorizationError} When type is 'AUTHORIZATION'
   * @throws {NotFoundError} When type is 'NOT_FOUND'
   * @throws {BadRequestError} When type is 'BAD_REQUEST'
   * @throws {InternalError} When type is 'INTERNAL', 'SERVICE' or unknown
   */
  async testError(type: string): Promise<never> {
    switch (type) {
      case 'VALIDATION':
        throw new ValidationError('Invalid input data', {
          field: 'email',
          constraint: 'format'
        });

      case 'SERVICE':
        throw new InternalError('Service Error');

      case 'AUTHENTICATION':
        throw new AuthenticationError('Invalid or expired token');

      case 'AUTHORIZATION':
        throw new AuthorizationError('Insufficient permissions');

      case 'NOT_FOUND':
        throw new NotFoundError('Resource not found');

      case 'BAD_REQUEST':
        throw new BadRequestError('Invalid request parameters', {
          param: 'id',
          reason: 'must be a number'
        });

      case 'INTERNAL':
        throw new InternalError('Unexpected server error');

      default:
        throw new InternalError('Unknown error type');
    }
  }
} 