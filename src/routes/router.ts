import { Router } from 'express';
import { createHealthRoutes } from './healthRoutes';

export const createV1Router = () => {
  const v1Router = Router();
  v1Router.use('/health', createHealthRoutes());
  return v1Router;
};

const router = Router();
router.use('/v1', createV1Router());
export default router; 