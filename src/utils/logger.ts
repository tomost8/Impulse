import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../config/env';

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 根据环境选择日志级别
const level = env.NODE_ENV === 'development' ? 'debug' : 'warn';

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...rest } = info;
    return `${timestamp} ${level}: ${message} ${
      Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''
    }`;
  })
);

// 创建 logger
const logger = winston.createLogger({
  level,
  levels,
  format,
  transports: [
    // 错误日志写入文件
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    // 所有日志写入文件
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// 在开发环境下添加控制台输出
if (env.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger; 