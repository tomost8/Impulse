import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, z } from 'zod';
import { ValidationError } from '../types/AppError';

export const createValidator = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // update request with parsed data
      req.body = result.body;
      req.query = result.query;
      req.params = result.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ValidationError(error.errors[0].message));
      }
      next(error);
    }
  };
}; 