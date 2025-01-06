import { HealthCheckResult, TestErrorType } from '../types/health';
import { ServiceError, ValidationError, DatabaseError } from '../types/AppError';
import logger from '../utils/logger';
import { IHealthCheck } from '../interfaces/health';

export class HealthService implements IHealthCheck {
  async checkDatabase(): Promise<HealthCheckResult> {
    // TODO: Add database health check
    return { status: true };
  }

  async checkRedis(): Promise<HealthCheckResult> {
    // TODO: Add Redis health check
    return { status: true };
  }

  async checkServer(): Promise<HealthCheckResult> {
    return {
      status: true,
      details: `Server uptime: ${process.uptime()} seconds`
    };
  }

  async checkExternalServices(): Promise<HealthCheckResult> {
    // TODO: Add external services health check
    return { status: true };
  }

  async checkMessageQueue(): Promise<HealthCheckResult> {
    // TODO: Add message queue health check
    return { status: true };
  }

  async checkMemoryUsage(): Promise<HealthCheckResult> {
    const used = process.memoryUsage();
    return {
      status: true,
      details: `Memory usage: ${Math.round(used.heapUsed / 1024 / 1024)}MB`
    };
  }

  async checkDiskSpace(): Promise<HealthCheckResult> {
    // TODO: Add disk space check
    return { status: true };
  }

  async testError(errorType: string): Promise<never> {
    // validate error type
    if (!Object.values(TestErrorType).includes(errorType as TestErrorType)) {
      throw new ValidationError(
        `Invalid error type. Must be one of: ${Object.values(TestErrorType).join(', ')}`
      );
    }

    switch (errorType as TestErrorType) {
      case TestErrorType.SERVICE:
        throw new ServiceError('Test service error', {
          test: { status: false, details: 'Test failure' }
        });
      case TestErrorType.VALIDATION:
        throw new ValidationError('Test validation error');
      case TestErrorType.DATABASE:
        throw new DatabaseError('Test database error');
      case TestErrorType.UNCAUGHT:
        setTimeout(() => {
          throw new Error('Test uncaught error');
        }, 0);
        throw new Error('Test uncaught error');
      default:
        throw new ValidationError('Unknown error type');
    }
  }

  async performHealthCheck(options: { 
    full?: boolean; 
    service?: string; 
    timeout?: number;
  }): Promise<{
    status: string;
    checks: Record<string, any>;
  }> {
    const { full = false, service, timeout = 5000 } = options;
    
    logger.info('Health check started', { full, service, timeout });
    
    const checks = {
      // core services check
      ...((!service || service === 'database') && {
        database: await this.checkDatabase()
      }),
      ...((!service || service === 'redis') && {
        redis: await this.checkRedis()
      }),
      ...((!service || service === 'server') && {
        server: await this.checkServer()
      }),
      
      ...(full && {
        // external services check
        externalApi: await this.checkExternalServices(),
        messageQueue: await this.checkMessageQueue(),
        
        // system resource check
        memory: await this.checkMemoryUsage(),
        disk: await this.checkDiskSpace(),
      }),
      
      // timestamp
      timestamp: new Date().toISOString()
    };

    // find all failed checks
    const failedChecks = Object.fromEntries(
      Object.entries(checks).filter(([_, value]) =>
        value && 
        typeof value === 'object' && 
        'status' in value && 
        !value.status
      )
    );

    if (Object.keys(failedChecks).length > 0) {
      logger.error('Health check failed', failedChecks);
      throw new ServiceError(
        'Service health check failed',
        failedChecks
      );
    }

    logger.info('Health check completed successfully', checks);
    return {
      status: 'ok',
      checks
    };
  }
} 