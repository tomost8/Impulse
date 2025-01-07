import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { 
  ValidationError, 
  BadRequestError, 
  InternalError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
} from '../../modules/common/errors/graphql.error';
import { 
  ComponentHealth,
  HealthCheckConfig,
  SystemHealthResponse,
  HealthMonitor
} from './interfaces';
import logger from '../../config/logger';
import { APP_CONSTANTS } from '../../config/env';
import * as os from 'os';
import * as fs from 'fs';

/**
 * Service responsible for monitoring system health
 * 
 * Implements health checks for various system components including:
 * - Database connectivity
 * - Redis availability
 * - Server status
 * - Memory usage
 * - Disk space
 * - External APIs
 * - Message queue
 */
@Service()
export class SystemHealthService implements HealthMonitor {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check database connection health
   */
  private async checkDatabase(timeout: number = APP_CONSTANTS.HEALTH_CHECK_TIMEOUT): Promise<ComponentHealth> {
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
   * Check Redis connection health
   */
  private async checkRedis(): Promise<ComponentHealth> {
    // TODO: Add Redis health check
    return { status: true };
  }

  /**
   * Check server status
   */
  private async checkServer(): Promise<ComponentHealth> {
    return {
      status: true,
      details: `Server uptime: ${process.uptime()} seconds`
    };
  }

  /**
   * Check external API health
   */
  private async checkExternalApi(): Promise<ComponentHealth> {
    // TODO: Add external API health check
    return { status: true };
  }

  /**
   * Check message queue health
   */
  private async checkMessageQueue(): Promise<ComponentHealth> {
    // TODO: Add message queue health check
    return { status: true };
  }

  /**
   * Check system memory usage
   */
  private async checkMemory(): Promise<ComponentHealth> {
    const processMemory = process.memoryUsage();
    const heapUsed = processMemory.heapUsed;
    const heapTotal = processMemory.heapTotal;
    const heapUsage = (heapUsed / heapTotal) * 100;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const systemMemUsage = ((totalMem - freeMem) / totalMem) * 100;

    return {
      status: true,
      details: `Memory usage: Heap ${heapUsage.toFixed(2)}% (${(heapUsed / 1024 / 1024).toFixed(2)}MB/${(heapTotal / 1024 / 1024).toFixed(2)}MB), System ${systemMemUsage.toFixed(2)}%`
    };
  }

  /**
   * Check disk space usage
   */
  private async checkDisk(): Promise<ComponentHealth> {
    try {
      const stats = fs.statfsSync('/');
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;
      const usagePercent = (used / total) * 100;

      return {
        status: usagePercent < 90,
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
   * Perform system health check
   */
  async checkHealth(config: HealthCheckConfig): Promise<SystemHealthResponse> {
    const { full = false, component, timeout = APP_CONSTANTS.HEALTH_CHECK_TIMEOUT } = config;
    const components: Record<string, ComponentHealth> = {};

    if (component) {
      switch (component) {
        case 'database':
          components.database = await this.checkDatabase(timeout);
          break;
        case 'redis':
          components.redis = await this.checkRedis();
          break;
        case 'server':
          components.server = await this.checkServer();
          break;
        case 'memory':
          components.memory = await this.checkMemory();
          break;
        case 'disk':
          components.disk = await this.checkDisk();
          break;
        case 'externalApi':
          components.externalApi = await this.checkExternalApi();
          break;
        case 'messageQueue':
          components.messageQueue = await this.checkMessageQueue();
          break;
        default:
          throw new BadRequestError(`Unknown component: ${component}`);
      }
    } else if (full) {
      components.database = await this.checkDatabase(timeout);
      components.redis = await this.checkRedis();
      components.server = await this.checkServer();
      components.memory = await this.checkMemory();
      components.disk = await this.checkDisk();
      components.externalApi = await this.checkExternalApi();
      components.messageQueue = await this.checkMessageQueue();
    } else {
      components.database = await this.checkDatabase(timeout);
      components.redis = await this.checkRedis();
      components.server = await this.checkServer();
    }

    const status = Object.values(components).every(check => check.status) ? 'ok' : 'error';

    return {
      status,
      components,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Simulate various error scenarios for testing
   */
  async simulateError(scenario: string): Promise<never> {
    switch (scenario.toUpperCase()) {
      case 'VALIDATION':
        throw new ValidationError('Validation error test');
      case 'AUTHENTICATION':
        throw new AuthenticationError('Authentication error test');
      case 'AUTHORIZATION':
        throw new AuthorizationError('Authorization error test');
      case 'NOT_FOUND':
        throw new NotFoundError('Not found error test');
      case 'BAD_REQUEST':
        throw new BadRequestError('Bad request error test');
      default:
        throw new InternalError('Internal error test');
    }
  }
} 