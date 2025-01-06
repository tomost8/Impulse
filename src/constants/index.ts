// export all constants
export * from './http';
export * from './errors';
export * from './config';

// add application constants
export const APP_CONSTANTS = {
  VERSION: '1.0.0',
  API_TIMEOUT: 5000,
  MAX_RETRIES: 3,
} as const; 