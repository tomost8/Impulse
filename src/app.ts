import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json } from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { Container } from 'typedi';
import { createSchema } from './config/graphql';
import { ErrorService } from './modules/common/errors/error.service';
import { GraphQLFormattedError } from 'graphql';
import { createHealthRoutes } from './modules/health/health.routes';
import { requestLogger } from './config/logger';

export async function createApp() {
  const app = express();

  // middleware
  app.use(cors());
  app.use(helmet());
  app.use(json());
  app.use(requestLogger);

  // create Apollo Server
  const schema = await createSchema();
  const errorService = Container.get(ErrorService);
  
  const server = new ApolloServer({
    schema,
    formatError: (formattedError: GraphQLFormattedError) => {
      if ('originalError' in formattedError) {
        return errorService.formatError(formattedError as any);
      }
      return formattedError;
    },
  });

  await server.start();

  // GraphQL middleware
  app.use('/graphql', expressMiddleware(server));

  // health check routes
  app.use('/api/v1/health', createHealthRoutes());

  return app;
} 