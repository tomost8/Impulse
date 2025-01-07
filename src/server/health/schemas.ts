import { z } from 'zod';

/**
 * Validation schema for health check query parameters
 */
export const healthCheckQuerySchema = z.object({
  query: z.object({
    full: z.string().optional(),
    component: z.string().optional(),
    timeout: z.string().optional(),
  }),
}); 