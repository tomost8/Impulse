// 集中导出常量
export * from './http';
export * from './errors';
export * from './config';

// 添加应用级常量
export const APP_CONSTANTS = {
  VERSION: '1.0.0',
  API_TIMEOUT: 5000,
  MAX_RETRIES: 3,
} as const; 