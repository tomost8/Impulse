import { Router } from 'express';
import { HealthController } from '../controllers/healthController';

const router = Router();
const healthController = new HealthController();

router.get('/', healthController.check);
router.get('/test-error', healthController.testError);

export default router; 