import { Router } from 'express';
import { HealthController } from '../controllers/healthController';
import { HealthService } from '../services/healthService';
import { createValidator } from '../middlewares/validator';
import { healthCheckSchema } from '../schemas/health.schema';

export const createHealthRoutes = () => {
  const router = Router();
  const healthService = new HealthService();
  const healthController = new HealthController(healthService);

  router.get('/', createValidator(healthCheckSchema), healthController.check);
  router.get('/test-error', healthController.testError);

  return router;
}; 