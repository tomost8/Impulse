import { Router } from 'express';
import { Container } from 'typedi';
import { HealthController } from './controller';
import { validateRequest } from '../../modules/common/validators/zod.validator';
import { healthCheckQuerySchema } from './schemas';

export function createHealthRoutes(controller?: HealthController) {
  const router = Router();
  const healthController = controller || Container.get(HealthController);

  // Health check endpoint
  router.get(
    '/',
    validateRequest(healthCheckQuerySchema),
    async (req, res, next) => {
      try {
        const { full, component, timeout } = req.query;
        const result = await healthController.checkHealth({
          full: !!full,
          component: component?.toString(),
          timeout: timeout ? parseInt(timeout.toString()) : undefined,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // Error simulation endpoint
  router.get('/test-error', async (req, res, next) => {
    try {
      const { type = 'UNCAUGHT' } = req.query;
      await healthController.simulateError(type.toString());
      res.json({ message: 'No error occurred' });
    } catch (error) {
      next(error);
    }
  });

  return router;
} 