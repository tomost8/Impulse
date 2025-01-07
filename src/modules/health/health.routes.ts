import { Router } from 'express';
import { Container } from 'typedi';
import { HealthController } from './health.controller';
import { validateRequest } from '../common/validators/zod.validator';
import { healthCheckQuerySchema } from './health.schema';

export function createHealthRoutes(controller?: HealthController) {
  const router = Router();
  const healthController = controller || Container.get(HealthController);

  // Health check endpoints
  router.get(
    '/',
    validateRequest(healthCheckQuerySchema),
    async (req, res, next) => {
      try {
        const { full, service, timeout } = req.query;
        const result = await healthController.checkHealth({
          full: !!full,
          service: service?.toString(),
          timeout: timeout ? parseInt(timeout.toString()) : undefined,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get('/test-error', async (req, res, next) => {
    try {
      const { type = 'UNCAUGHT' } = req.query;
      await healthController.testError(type.toString());
      res.json({ message: 'No error occurred' });
    } catch (error) {
      next(error);
    }
  });

  return router;
} 