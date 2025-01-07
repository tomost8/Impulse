import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { ValidationError, BadRequestError, InternalError } from '../common/errors/graphql.error';
import { 
  HealthCheckResult, 
  IHealthCheck, 
  HealthCheckOptions, 
  HealthCheckResponse 
} from './health.types';
import logger from '../../config/logger';
import { APP_CONSTANTS } from '../../config/env';

@Service()
export class HealthService implements IHealthCheck {
  constructor(private prisma: PrismaClient) {}

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

  private async checkRedis(): Promise<HealthCheckResult> {
    // TODO: Add Redis health check
    return { status: true };
  }

  private async checkServer(): Promise<HealthCheckResult> {
    return {
      status: true,
      details: `Server uptime: ${process.uptime()} seconds`
    };
  }

  private async checkExternalServices(): Promise<HealthCheckResult> {
    // TODO: Add external services health check
    return { status: true };
  }

  private async checkMessageQueue(): Promise<HealthCheckResult> {
    // TODO: Add message queue health check
    return { status: true };
  }

  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const used = process.memoryUsage();
    return {
      status: true,
      details: `Memory usage: ${Math.round(used.heapUsed / 1024 / 1024)}MB`
    };
  }

  private async checkDiskSpace(): Promise<HealthCheckResult> {
    // TODO: Add disk space check
    return { status: true };
  }

  async performHealthCheck(options: HealthCheckOptions): Promise<HealthCheckResponse> {
    const { full = false, service, timeout = APP_CONSTANTS.HEALTH_CHECK_TIMEOUT } = options;
    
    logger.info('Health check started', { full, service, timeout });
    
    const checks: Record<string, HealthCheckResult> = {};

    // Core services check
    if (!service || service === 'database') {
      checks.database = await this.checkDatabase(timeout);
    }

    if (!service || service === 'redis') {
      checks.redis = await this.checkRedis();
    }

    if (!service || service === 'server') {
      checks.server = await this.checkServer();
    }

    // Full check includes additional services
    if (full) {
      checks.externalApi = await this.checkExternalServices();
      checks.messageQueue = await this.checkMessageQueue();
      checks.memory = await this.checkMemoryUsage();
      checks.disk = await this.checkDiskSpace();
    }

    // Add timestamp
    const timestamp = new Date().toISOString();

    // Check for failures
    const hasFailures = Object.values(checks).some(check => !check.status);

    if (hasFailures) {
      logger.error('Health check failed', { checks, timestamp });
      return {
        status: 'error',
        checks,
        timestamp
      };
    }

    logger.info('Health check completed successfully', { checks, timestamp });
    return {
      status: 'ok',
      checks,
      timestamp
    };
  }

  async testError(type: string): Promise<never> {
    switch (type) {
      case 'SERVICE':
        throw new InternalError('Service Error');
      case 'VALIDATION':
        throw new ValidationError('Validation Error');
      case 'DATABASE':
        throw new InternalError('Database Error');
      case 'BAD_REQUEST':
        throw new BadRequestError('Bad Request Error');
      case 'UNCAUGHT':
        throw new Error('Uncaught Error');
      default:
        throw new InternalError('Unknown Error');
    }
  }
} 