import 'reflect-metadata';
import { env } from './config/env';
import { createApp } from './app';
import logger from './config/logger';
import { Container } from 'typedi';
import { ProcessService } from './modules/system/process.service';

async function bootstrap() {
  try {
    const app = await createApp();
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${env.PORT}`);
      logger.info(`🚀 GraphQL ready at http://localhost:${env.PORT}/graphql`);
    });

    // setup signal handlers
    const processService = Container.get(ProcessService);
    processService.setupSignalHandlers(server);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();