import { z } from 'zod';

export const healthCheckSchema = z.object({
  query: z.object({
    full: z.enum(['true', 'false']).optional()
      .transform(val => val === 'true'),
    service: z.enum(['database', 'redis', 'server', 'external', 'queue'])
      .optional()
      .describe('Must be one of: database, redis, server, external, queue'),
    timeout: z.string()
      .optional()
      .refine(
        (val) => val === undefined || !isNaN(Number(val)),
        'Timeout must be a valid number'
      )
      .transform(val => val === undefined ? undefined : Number(val))
      .refine(
        (val) => val === undefined || val > 0,
        'Timeout must be a positive number'
      ),
  }).strict(),
}); 