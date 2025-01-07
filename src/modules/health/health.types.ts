import { z } from 'zod';

export interface HealthCheckResult {
  status: boolean;
  details?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  checks: Record<string, HealthCheckResult>;
  timestamp: string;
}

export interface HealthCheckOptions {
  full?: boolean;
  service?: string;
  timeout?: number;
}

export interface IHealthCheck {
  performHealthCheck(options: HealthCheckOptions): Promise<HealthCheckResponse>;
  testError(type: string): Promise<never>;
} 