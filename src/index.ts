import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './core/app';
import { setupApiErrorHandlers } from './middlewares/errorHandler';
import routes from './routes/router';
import logger from './utils/logger';
import { env } from './config/env';
import { setupProcessHandlers } from './core/processManager';

async function startServer() {
  try {
    // TODO: connect to database
    // await connectToDatabase();
    
    const app = createApp();
    app.use('/api', routes);
    setupApiErrorHandlers(app);
    
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Setup all process handlers
    setupProcessHandlers(server);

  } catch (error) {
    logger.error('Server Startup Error:', error);
    process.exit(1);
  }
}

startServer();