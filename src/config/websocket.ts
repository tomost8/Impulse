import { useServer} from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import { GraphQLSchema } from 'graphql';

interface User {
  id: number;
}

interface ConnectionParams {
  user?: User;
}

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
      context: (ctx: { connectionParams?: ConnectionParams }) => {
        // 从连接初始化消息中获取用户信息
        const connectionParams = ctx.connectionParams;
        console.log('WebSocket connection params:', connectionParams);
        
        return {
          user: connectionParams?.user
        };
      },
      /**
       * Handler for client connection events
       * 
       * @param ctx - Connection context containing client information
       * @remarks Useful for setting up client-specific state or authentication
       */
      onConnect: (ctx: { connectionParams?: ConnectionParams }) => {
        const user = ctx.connectionParams?.user;
        console.log('Client connected with user:', user);
        if (!user?.id) {
          throw new Error('No user ID provided');
        }
        return true;
      },
      /**
       * Handler for client disconnection events
       * 
       * @param context - Connection context containing client information
       * @remarks Useful for cleanup of client-specific resources
       */
      onDisconnect: (ctx) => {
        console.log('Client disconnected');
      },
    },
    wsServer
  );

  console.log('WebSocket server configured at /graphql');
}
