import { useServer} from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import { GraphQLSchema } from 'graphql';

/**
 * Configure WebSocket server for GraphQL subscriptions
 * 
 * This function sets up a WebSocket server to handle GraphQL subscriptions,
 * enabling real-time updates for clients. It integrates with the existing
 * HTTP server and uses the same GraphQL schema.
 * 
 * Features:
 * - Shared endpoint with GraphQL HTTP server
 * - Connection lifecycle management
 * - Real-time subscription support
 * 
 * @param httpServer - The existing HTTP server instance to attach WebSocket to
 * @param schema - The GraphQL schema used for subscription operations
 * 
 * @example
 * ```typescript
 * const httpServer = createServer(app);
 * const schema = buildSchema({...});
 * 
 * configureWebSocket(httpServer, schema);
 * ```
 */
export function configureWebSocket(httpServer: any, schema: GraphQLSchema) {
  // Create WebSocketServer instance
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql', // Same path as GraphQL API endpoint
  });

  // Configure GraphQL WebSocket server
  useServer(
    {
      schema,
      /**
       * Handler for client connection events
       * 
       * @param context - Connection context containing client information
       * @remarks Useful for setting up client-specific state or authentication
       */
      onConnect: (context) => {
        console.log('Client connected');
      },
      /**
       * Handler for client disconnection events
       * 
       * @param context - Connection context containing client information
       * @remarks Useful for cleanup of client-specific resources
       */
      onDisconnect: (context) => {
        console.log('Client disconnected');
      },
    },
    wsServer
  );

  console.log('WebSocket server configured at /graphql');
}
