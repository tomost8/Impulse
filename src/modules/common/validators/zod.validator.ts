import { z } from 'zod';
import { ValidationError } from '../errors/graphql.error';
import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware for request validation using Zod schemas
 * 
 * This middleware validates the request's query parameters, body, and URL parameters
 * against a provided Zod schema. If validation fails, it passes a ValidationError
 * to the next error handler.
 * 
 * @param schema - The Zod schema to validate against
 * @returns An Express middleware function
 * 
 * @throws {ValidationError} When validation fails
 * 
 * @example
 * ```typescript
 * const schema = z.object({
 *   query: z.object({
 *     page: z.string().optional().transform(val => parseInt(val) || 1)
 *   })
 * });
 * 
 * router.get(
 *   '/users',
 *   validateRequest(schema),
 *   async (req, res) => {
 *     const { page } = req.query; // page is now a number
 *     // ... handle request
 *   }
 * );
 * ```
 */
export function validateRequest(schema: z.AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Update request with validated and transformed data
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