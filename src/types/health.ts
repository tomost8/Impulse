export interface HealthCheckResult {
  status: boolean;
  details?: string | Record<string, any>;
}

export enum TestErrorType {
  SERVICE = 'SERVICE',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  UNCAUGHT = 'UNCAUGHT'
} 