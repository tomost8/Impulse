import { Router } from 'express';
import healthRoutes from './healthRoutes';

const router = Router();

// API version 1
const v1Router = Router();
v1Router.use('/health', healthRoutes);

// Mount versioned routes
router.use('/v1', v1Router);

export default router; 