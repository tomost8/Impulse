import { Service } from 'typedi';
import { HealthService } from './health.service';
import { HealthCheckOptions, HealthCheckResponse } from './health.types';

@Service()
export class HealthController {
  constructor(private healthService: HealthService) {}

  async checkHealth(options: HealthCheckOptions): Promise<HealthCheckResponse> {
    return this.healthService.performHealthCheck(options);
  }

  async testError(type: string): Promise<never> {
    return this.healthService.testError(type);
  }
} 