export interface IHealthCheck {
  checkDatabase(): Promise<HealthCheckResult>;
  checkRedis(): Promise<HealthCheckResult>;
  checkServer(): Promise<HealthCheckResult>;
  checkExternalServices(): Promise<HealthCheckResult>;
  checkMessageQueue(): Promise<HealthCheckResult>;
  checkMemoryUsage(): Promise<HealthCheckResult>;
  checkDiskSpace(): Promise<HealthCheckResult>;
  performHealthCheck(options: HealthCheckOptions): Promise<HealthCheckResponse>;
  testError(errorType: string): Promise<never>;
}

export interface HealthCheckOptions {
  full?: boolean;
  service?: string;
  timeout?: number;
}

export interface HealthCheckResult {
  status: boolean;
  details?: string | Record<string, any>;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  checks: Record<string, HealthCheckResult>;
} 