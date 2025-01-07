import { z } from 'zod';
import { ValidationError } from '../errors/graphql.error';
import { Request, Response, NextFunction } from 'express';

/**
 * 验证输入数据
 * @param schema zod schema
 * @param data 要验证的数据
 * @returns 验证后的数据
 * @throws ValidationError
 */
export function validateInput<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message);
    }
    throw error;
  }
}

/**
 * Express 中间件形式的验证器
 * @param schema zod schema
 */
export function validateRequest(schema: z.AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // 更新请求中的数据为验证后的数据
      req.body = result.body;
      req.query = result.query;
      req.params = result.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError(error.errors[0].message));
        return;
      }
      next(error);
    }
  };
}

/**
 * GraphQL 方法装饰器形式的验证器
 * @param schema zod schema
 * @returns 方法装饰器
 */
export function ValidateInput<T extends z.ZodType>(schema: T) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const validatedArgs = args.map(arg => {
        try {
          return schema.parse(arg);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new ValidationError(error.errors[0].message);
          }
          throw error;
        }
      });

      return originalMethod.apply(this, validatedArgs);
    };

    return descriptor;
  };
} 