import Queue from 'bull';
import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

type ResetType = 'weekly' | 'monthly';

@Service()
export class PointResetService {
  public pointsResetQueue: Queue.Queue;

  constructor(private prisma: PrismaClient) {
    // Initialize queue
    this.pointsResetQueue = new Queue('points-reset', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    this.setupProcessor();
    this.initializeSchedulers();
  }

  private setupProcessor() {
    this.pointsResetQueue.process(async (job) => {
      const resetType: ResetType = job.data.type;
      logger.info(`Processing ${resetType} points reset`, {
        resetType
      });

      // Reset points
      await this.prisma.point.updateMany({
        data: {
          ...(resetType === 'weekly' ? {
            weekly_points: 0,
            weekly_update_at: new Date()
          } : {
            monthly_points: 0,
            monthly_update_at: new Date()
          })
        }
      });
      logger.info(`${resetType} points reset completed`, {
        resetType
      });
    });
  }

  private initializeSchedulers() {
    //cron: '* * * * *'  // Every minute 
    this.pointsResetQueue.add(
      { type: 'weekly' },
      {
        repeat: {
          cron: '0 0 * * 0' // Every Sunday at midnight
        }
      }
    );

    this.pointsResetQueue.add(
      { type: 'monthly' },
      {
        repeat: {
          cron: '0 0 1 * *' // First day of every month at midnight
        }
      }
    );
  }

  /**
   * Gracefully shut down the expiration queue
   * 
   * @remarks This should be called when the application is shutting down
   * @returns Promise that resolves when the queue is closed
   */
  async shutdown() {
    await this.pointsResetQueue.close();
  }
}