import { Router } from 'express';
import { createHealthRoutes } from './healthRoutes';
import { createUserRoutes } from './userRoutes';

export const createV1Router = () => {
  const v1Router = Router();
  v1Router.use('/health', createHealthRoutes());
  v1Router.use('/users', createUserRoutes());
  return v1Router;
};

const router = Router();
router.use('/v1', createV1Router());
export default router; 