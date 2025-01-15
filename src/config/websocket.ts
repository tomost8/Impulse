import { useServer} from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import { GraphQLSchema } from 'graphql';

export function configureWebSocket(httpServer: any, schema: GraphQLSchema) {
  // 创建 WebSocketServer 实例
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql', // 与 GraphQL API 路由一致
  });

  // 使用 GraphQL WebSocket 服务
  useServer(
    {
      schema,
      onConnect: (context) => {
        console.log('Client connected');
      },
      onDisconnect: (context) => {
        console.log('Client disconnected');
      },
    },
    wsServer
  );

  console.log('WebSocket server configured at /graphql');
}
