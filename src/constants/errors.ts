export const ERROR_MESSAGES = {
  NOT_FOUND: (resource: string) => `Route ${resource} not found`,
  UNAUTHORIZED: 'Unauthorized access',
  SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
} as const; 