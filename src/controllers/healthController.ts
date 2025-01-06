import { Request, Response, NextFunction } from 'express';
import { AppError, DatabaseError, ServiceError, ValidationError } from '../errors/types/AppError';
import logger from '../utils/logger';

interface HealthCheckResult {
  status: boolean;
  details?: string;
}

interface HealthCheckOptions {
  full?: boolean;      // 是否执行完整检查
  service?: string;    // 指定检查特定服务
  timeout?: number;    // 检查超时时间
}

// 添加错误类型枚举
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
        // 核心服务检查
        ...((!service || service === 'database') && {
          database: await this.checkDatabase()
        }),
        ...((!service || service === 'redis') && {
          redis: await this.checkRedis()
        }),
        ...((!service || service === 'server') && {
          server: await this.checkServer()
        }),
        
        // 只在完整检查时执行的检查项
        ...(full && {
          // 外部服务检查
          externalApi: await this.checkExternalServices(),
          messageQueue: await this.checkMessageQueue(),
          
          // 系统资源检查
          memory: await this.checkMemoryUsage(),
          disk: await this.checkDiskSpace(),
        }),
        
        // 时间戳
        timestamp: new Date().toISOString()
      };

      // 找出所有失败的检查
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

  // 核心服务检查
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

  // 外部服务检查
  private async checkExternalServices(): Promise<HealthCheckResult> {
    // TODO: Add external services health check
    return { status: true };
  }

  private async checkMessageQueue(): Promise<HealthCheckResult> {
    // TODO: Add message queue health check
    return { status: true };
  }

  // 系统资源检查
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

  // 添加测试错误的方法
  testError = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errorType = req.query.type as string;
      
      // 验证错误类型
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