import { Server } from 'http';

export interface IProcessManager {
  cleanup(): Promise<void>;
  shutdownServer(server: Server): Promise<void>;
  setupSignalHandlers(server: Server): void;
} 