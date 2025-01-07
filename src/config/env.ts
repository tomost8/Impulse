import { z } from 'zod';
import { CorsOptions } from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Set up environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
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
  NODE_ENV: validatedEnv.NODE_ENV,
  PORT: validatedEnv.PORT,
  DATABASE_URL: validatedEnv.DATABASE_URL,
  CORS_ORIGIN: validatedEnv.CORS_ORIGIN,
  JWT_SECRET: validatedEnv.JWT_SECRET,
  JWT_EXPIRES_IN: validatedEnv.JWT_EXPIRES_IN,
  CORS: {
    origin: validatedEnv.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as string[],
    credentials: true
  } satisfies CorsOptions,
  isDevelopment: validatedEnv.NODE_ENV === 'development',
  isProduction: validatedEnv.NODE_ENV === 'production',
  isTest: validatedEnv.NODE_ENV === 'test',
} as const;

export const APP_CONSTANTS = {
  VERSION: '1.0.0',
  API_TIMEOUT: 5000,
  MAX_RETRIES: 3,
  HEALTH_CHECK_TIMEOUT: 5000,
} as const; 