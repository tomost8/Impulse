import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/healthService';
import { IHealthCheck } from '../interfaces/health';

interface HealthCheckOptions {
  full?: boolean;      // check all services
  service?: string;    // check specific service
  timeout?: number;    // check timeout
}

export class HealthController {
  constructor(private readonly healthService: IHealthCheck) {}

  check = async (req: Request<{}, {}, {}, HealthCheckOptions>, res: Response, next: NextFunction) => {
    try {
      const result = await this.healthService.performHealthCheck(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  testError = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errorType = req.query.type as string;
      await this.healthService.testError(errorType);
    } catch (error) {
      next(error);
    }
  }
} 