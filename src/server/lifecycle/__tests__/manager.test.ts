import 'reflect-metadata';
import { Container } from 'typedi';
import { ServerLifecycleManagerImpl } from '../manager';
import { ErrorService } from '../../../modules/common/errors/error.service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Server } from 'http';
import express from 'express';

jest.mock('../../../config/logger');
jest.mock('../../../modules/common/errors/error.service');

describe('ServerLifecycleManager', () => {
  let lifecycleManager: ServerLifecycleManagerImpl;
  let server: Server;
  let prisma: DeepMockProxy<PrismaClient>;
  let errorService: DeepMockProxy<ErrorService>;
  let processExitSpy: jest.SpyInstance;
  let processOnSpy: jest.SpyInstance;
  let eventHandlers: { [key: string]: Function } = {};

  beforeAll(async () => {
    // Mock services
    prisma = mockDeep<PrismaClient>();
    errorService = mockDeep<ErrorService>();
    
    Container.set(PrismaClient, prisma);
    Container.set(ErrorService, errorService);
    lifecycleManager = Container.get(ServerLifecycleManagerImpl);
    
    const app = express();
    server = app.listen(3001); // 使用不同的端口避免冲突

    // Mock process.exit
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      return undefined as never;
    });
    // Mock process.on
    processOnSpy = jest.spyOn(process, 'on').mockImplementation((event: string | symbol, listener: (...args: any[]) => void) => {
      eventHandlers[event.toString()] = listener;
      return process;
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    processExitSpy.mockRestore();
    processOnSpy.mockRestore();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    eventHandlers = {};
  });

  it('should cleanup resources', async () => {
    await expect(lifecycleManager.cleanup()).resolves.not.toThrow();
  });

  it('should shutdown server gracefully', async () => {
    await expect(lifecycleManager.shutdownServer(server)).resolves.not.toThrow();
  });

  it('should handle cleanup errors gracefully', async () => {
    // 模拟数据库断开连接失败
    prisma.$disconnect.mockRejectedValueOnce(new Error('Disconnect failed'));
    
    await expect(lifecycleManager.cleanup()).rejects.toThrow('Disconnect failed');
  });

  it('should handle server shutdown errors gracefully', async () => {
    const badServer = new Server();
    await expect(lifecycleManager.shutdownServer(badServer)).resolves.not.toThrow();
  });

  describe('setupSignalHandlers', () => {
    it('should setup signal handlers', () => {
      lifecycleManager.setupSignalHandlers(server);
      expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('should handle uncaught exceptions correctly', async () => {
      const cleanupSpy = jest.spyOn(lifecycleManager, 'cleanup').mockResolvedValue();
      lifecycleManager.setupSignalHandlers(server);
      const error = new Error('Test error');
      await eventHandlers['uncaughtException'](error);
      expect(errorService.handleUncaughtException).toHaveBeenCalledWith(error);
      await new Promise(process.nextTick);
      expect(cleanupSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unhandled rejections correctly', async () => {
      const cleanupSpy = jest.spyOn(lifecycleManager, 'cleanup').mockResolvedValue();
      lifecycleManager.setupSignalHandlers(server);
      const reason = new Error('Test rejection');
      await eventHandlers['unhandledRejection'](reason);
      expect(errorService.handleUnhandledRejection).toHaveBeenCalledWith(reason);
      await new Promise(process.nextTick);
      expect(cleanupSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle graceful shutdown correctly', async () => {
      const cleanupSpy = jest.spyOn(lifecycleManager, 'cleanup').mockResolvedValue();
      const shutdownSpy = jest.spyOn(lifecycleManager, 'shutdownServer').mockResolvedValue();
      lifecycleManager.setupSignalHandlers(server);
      await eventHandlers['SIGTERM']();
      expect(cleanupSpy).toHaveBeenCalled();
      expect(shutdownSpy).toHaveBeenCalledWith(server);
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });
  });
}); 