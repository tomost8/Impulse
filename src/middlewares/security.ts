import { Application } from 'express';

export const setupSecurityMiddleware = (app: Application) => {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'deny');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}; 