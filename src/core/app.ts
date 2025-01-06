import express from 'express';
import cors from 'cors';
import { env } from '../config/env';
import { setupSecurityMiddleware } from '../middlewares/security';

export const createApp = () => {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(cors(env.CORS));
  
  // Security middleware
  setupSecurityMiddleware(app);

  return app;
}; 