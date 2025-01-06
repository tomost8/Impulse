import { Application } from 'express';
import { CONFIG } from '../constants';

export const setupSecurityMiddleware = (app: Application) => {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', CONFIG.SECURITY.HEADERS.NOSNIFF);
    res.setHeader('X-Frame-Options', CONFIG.SECURITY.HEADERS.FRAME_OPTIONS);
    res.setHeader('X-XSS-Protection', CONFIG.SECURITY.HEADERS.XSS_PROTECTION);
    next();
  });
}; 