import { Request, Response, NextFunction } from 'express';
import { AppError, DatabaseError, ServiceError, ValidationError } from '../errors/types/AppError';
import logger from '../utils/logger';

interface HealthCheckResult {
  status: boolean;
  details?: string;
}

interface HealthCheckOptions {
  full?: boolean;      // check all services
  service?: string;    // check specific service
  timeout?: number;    // check timeout
}

// add test error type
enum TestErrorType {
  SERVICE = 'service',
  VALIDATION = 'validation',
  DATABASE = 'database',
  UNCAUGHT = 'uncaught'
}

export class HealthController {
  check = async (req: Request<{}, {}, {}, HealthCheckOptions>, res: Response, next: NextFunction) => {
    try {
      const { full = false, service, timeout = 5000 } = req.query;
      
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
      res.json({
        status: 'ok',
        checks
      });
    } catch (error) {
      next(error);
    }
  }

  // check database
  private async checkDatabase(): Promise<HealthCheckResult> {
    // TODO: Add database health check
    return { status: true };
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

  // external services check
  private async checkExternalServices(): Promise<HealthCheckResult> {
    // TODO: Add external services health check
    return { status: true };
  }

  private async checkMessageQueue(): Promise<HealthCheckResult> {
    // TODO: Add message queue health check
    return { status: true };
  }

  // system resource check
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

  // add test error method
  testError = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errorType = req.query.type as string;
      
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
          return;
        default:
          throw new ValidationError('Unknown error type');
      }
    } catch (error) {
      next(error);
    }
  }
} 