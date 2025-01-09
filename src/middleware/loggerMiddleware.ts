import { MiddlewareFn } from "type-graphql";
import logger from "../config/logger";

/**
 * Middleware for logging GraphQL operations
 * 
 * Logs the following information for each operation:
 * - Operation type and name
 * - Execution time
 * - Arguments (sanitized)
 * - Success/failure status
 * - Error details (if any)
 */
// src/modules/common/middleware/loggerMiddleware.ts
export const LogOperationMiddleware: MiddlewareFn = async ({ info, args }, next) => {
    const startTime = Date.now();
    const operation = `${info.parentType.name}.${info.fieldName}`;
  
    try {
      const result = await next();
  
      // 只记录操作成功的基本信息
      logger.info(`GraphQL ${operation} completed`, {
        operation,
        duration: `${Date.now() - startTime}ms`,
        success: true
      });
  
      return result;
    } catch (err: any) {
      // 错误日志需要更详细的信息
      logger.error(`GraphQL ${operation} failed`, {
        operation,
        duration: `${Date.now() - startTime}ms`,
        arguments: sanitizeArgs(args),  // 错误情况下记录参数有助于调试
        error: err?.message || 'Unknown error',
        stack: err?.stack
      });
      throw err;
    }
  };

/**
 * Sanitize sensitive data from arguments
 * 
 * @param args - Original arguments
 * @returns Sanitized arguments
 */
function sanitizeArgs(args: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['password', 'token', 'secret', 'firebaseUid'];
  const sanitized = { ...args };

  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeArgs(sanitized[key]);
    }
  });

  return sanitized;
} 