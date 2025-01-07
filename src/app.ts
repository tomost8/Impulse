import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { json } from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { Container } from 'typedi';
import { createSchema } from './config/graphql';
import { ErrorService } from './modules/common/errors/error.service';
import { GraphQLFormattedError } from 'graphql';
import { createHealthRoutes } from './server/health/routes';
import { requestLogger } from './config/logger';
import { env } from './config/env';

export async function createApp() {
  const app = express();

  // middleware
  app.use(cors(env.CORS));
  // app.use(helmet());
  app.use(json());
  app.use(requestLogger);

  // GraphQL setup
  const schema = await createSchema();
  const errorService = Container.get(ErrorService);

  const httpServer = http.createServer(app);

  
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault()
    ],
    formatError: (formattedError: GraphQLFormattedError) => {
      if ('originalError' in formattedError) {
        return errorService.formatError(formattedError as any);
      }
      return formattedError;
    },
  });

  await server.start();

  // GraphQL middleware
  app.use('/graphql', 
    // GraphQL middleware
    expressMiddleware(server, {
      context: async ({ req }) => ({
        // TODO: add user authentication
        req
      })
    })
  );
  // health check routes
  app.use('/api/v1/health', createHealthRoutes());

  // error handling
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    errorService.handleUncaughtException(err);
    res.status(500).json({
      error: env.isProduction ? 'Internal Server Error' : err.message
    });
  });

  return app;
} 