import { Server } from 'http';

/**
 * Interface for managing Express server lifecycle
 * 
 * Handles server shutdown, cleanup, and process signal management
 */
export interface ServerLifecycleManager {
  /**
   * Cleanup resources (database connections, etc.)
   */
  cleanup(): Promise<void>;

  /**
   * Gracefully shutdown the HTTP server
   * 
   * @param server - The HTTP server instance to shutdown
   */
  shutdownServer(server: Server): Promise<void>;

  /**
   * Setup process signal handlers for graceful shutdown
   * 
   * @param server - The HTTP server instance to manage
   */
  setupSignalHandlers(server: Server): void;
} 