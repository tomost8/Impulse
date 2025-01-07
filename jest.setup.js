require('reflect-metadata');

// 设置测试超时时间
jest.setTimeout(10000);

// 在所有测试之前运行
beforeAll(() => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
  process.env.DATABASE_URL = 'postgresql://admin:123456@localhost:5432/impulse_test?schema=public';
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.CORS_ORIGIN = '*';
}); 