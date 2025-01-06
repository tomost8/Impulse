import { z } from 'zod';
import { CorsOptions } from 'cors';

// Set up environment variables schema
const envSchema = z.object({
  // Server
  PORT: z.string()
    .transform(Number)
    .refine(n => !isNaN(n), {
      message: "PORT must be a valid number"
    }),
  
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .default('development'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
});

// Validate environment variables
const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Environment validation failed: ${parsed.error.toString()}`);
  }
  return parsed.data;
};

// Validate environment variables
const validatedEnv = validateEnv();

// Export environment variables
export const env = {
  // Server
  PORT: validatedEnv.PORT,
  NODE_ENV: validatedEnv.NODE_ENV,
  
  // CORS Options
  CORS: {
    origin: validatedEnv.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as string[],
    credentials: true
  } satisfies CorsOptions,
  
  // Environment check helper functions
  isDevelopment: validatedEnv.NODE_ENV === 'development',
  isProduction: validatedEnv.NODE_ENV === 'production',
  isTest: validatedEnv.NODE_ENV === 'test',
} as const; 