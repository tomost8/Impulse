// src/middleware/auth.middleware.ts
import * as admin from 'firebase-admin';
import { AuthenticationError } from '../modules/common/errors/graphql.error';

// 开发环境的模拟用户数据
const DEV_USER = {
  uid: 'dev-test-001',
  email: 'test001@example.com',
  name: 'Developer User',
  role: 'ADMIN'
};

// 开发环境的静态 token
const DEV_TOKEN = 'dev-token-123';

export interface AuthContext {
  user: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export const authMiddleware = async ({ context }: { context: any }, next: () => Promise<any>) => {
  try {
    const token = context.req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // 在开发环境中使用静态 token
    // if (process.env.NODE_ENV === 'development' && token === DEV_TOKEN) {
    //   context.user = DEV_USER;
    //   return next();
    // }

    // 生产环境使用 Firebase 验证
    const decodedToken = await admin.auth().verifyIdToken(token);
    context.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role
    };
    
    return next();
  } catch (error) {
    throw new AuthenticationError('Invalid token');
  }
};