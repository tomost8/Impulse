import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './core/app';
import { setupApiErrorHandlers } from './errors/handlers/apiErrors';
import routes from './routes/router';
import logger from './utils/logger';
import { env } from './config/env';
import { setupProcessErrors } from './errors/handlers/processErrors';
import { setupGracefulShutdown } from './core/processHandler';

// Setup process errors handler
setupProcessErrors();

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

    // Setup graceful shutdown
    setupGracefulShutdown(server);

  } catch (error) {
    logger.error('Server Startup Error:', error);
    process.exit(1);
  }
}

startServer();