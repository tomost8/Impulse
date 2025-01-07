import 'reflect-metadata';
import { env } from './config/env';
import { createApp } from './app';
import logger from './config/logger';
import { Container } from 'typedi';
import { ServerLifecycleManagerImpl } from './server/lifecycle';
import { ErrorService } from './modules/common/errors/error.service';

async function bootstrap() {
  try {
    const app = await createApp();
    const lifecycleManager = Container.get(ServerLifecycleManagerImpl);

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${env.PORT}`);
      logger.info(`🚀 GraphQL ready at http://localhost:${env.PORT}/graphql`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });

    // Setup lifecycle management
    lifecycleManager.setupSignalHandlers(server);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  logger.error('Fatal error during bootstrap:', error);
  process.exit(1);
});