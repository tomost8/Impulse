import { z } from 'zod';

export const healthCheckQuerySchema = z.object({
  query: z.object({
    full: z.string().optional().transform(val => val === 'true'),
    service: z.string().optional(),
    timeout: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  }).transform(({ full, service, timeout }) => ({
    full: full || false,
    service: service,
    timeout: timeout,
  })),
}); 