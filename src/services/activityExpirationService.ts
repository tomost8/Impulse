import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import Queue from 'bull';
import { startOfDay, addDays } from 'date-fns';
import logger from '../config/logger';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import moment from 'moment-timezone';

/**
 * Interface defining the structure of an activity expiration job
 */
interface ActivityExpirationJob {
  activityId: number;
  userId: number;
  timezone: string;
  scheduledDatetime: Date;
}

/**
 * Service handling activity expiration scheduling and processing
 * 
 * This service provides functionality for:
 * - Managing activity expiration through Bull queue
 * - Scheduling expiration jobs with timezone awareness
 * - Handling job failures and retries
 * - Graceful cleanup of expired activities
 * 
 * @remarks
 * Uses Bull queue for reliable job scheduling and processing
 */
@Service()
export class ActivityExpirationService {
  public expirationQueue: Queue.Queue;

  constructor(private prisma: PrismaClient) {
    // Initialize Bull queue for activity expiration
    this.expirationQueue = new Queue<ActivityExpirationJob>('activity-expiration', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        removeOnComplete: true, // Remove jobs after completion
        attempts: 3, // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 1000, // Initial delay of 1 second
        },
      },
    });

    // Process expiration jobs
    this.expirationQueue.process(async (job) => {
      const { activityId, userId, timezone } = job.data;
      
      try {
        // Update activity status to expired
        await this.prisma.activity.updateMany({
          where: {
            id: activityId,
            userId: userId,
            status: 'pending',
          },
          data: {
            status: 'expired',
          },
        });

        logger.info(`Activity ${activityId} marked as expired`, {
          activityId,
          userId,
          timezone,
        });
      } catch (error) {
        logger.error('Failed to expire activity:', {
          error,
          activityId,
          userId,
          timezone,
        });
        throw error; // Let the retry mechanism handle it
      }
    });

    // Error handling for queue events
    this.expirationQueue.on('error', (error) => {
      logger.error('Activity expiration queue error:', error);
    });

    this.expirationQueue.on('failed', (job, error) => {
      logger.error('Activity expiration job failed:', {
        jobId: job.id,
        error,
        data: job.data,
      });
    });
  }

  /**
   * Schedule an expiration job for a new activity
   * 
   * @param activityId - ID of the activity to expire
   * @param userId - ID of the user who owns the activity
   * @param timezone - User's timezone for accurate scheduling
   * @param scheduledDatetime - The scheduled datetime for the activity
   * @throws {Error} If scheduling fails
   * @remarks Expiration is scheduled for the start of the next day after scheduledDatetime
   */
  public async scheduleActivityExpiration(
    activityId: number,
    userId: number,
    timezone: string,
    scheduledDatetime: Date
  ) {
    try {
     // 1. 获取用户时区的日期
     const userDate = formatInTimeZone(scheduledDatetime, timezone, 'yyyy-MM-dd');
     console.log('userDate', userDate); // 2025-03-03

     // 2. 先计算下一天的日期
     const [year, month, day] = userDate.split('-');
     const nextDay = `${year}-${month}-${String(parseInt(day) + 1).padStart(2, '0')}`;
     console.log('nextDay', nextDay); // 2025-03-04
     
     // 3. 构建下一天凌晨的时间（用户时区）并转换为 UTC
     const utcExpirationTime = moment.tz(`${nextDay} 00:00`, 'YYYY-MM-DD HH:mm', timezone).utc().toDate();
     console.log('utcExpirationTime', utcExpirationTime);

     const delay = utcExpirationTime.getTime() - Date.now();
     console.log('delay', delay);


      // Add to delayed queue
      await this.expirationQueue.add(
        {
          activityId,
          userId,
          timezone,
          scheduledDatetime,
        },
        {
          delay,
        }
      );

      logger.info('Scheduled activity expiration:', {
        activityId,
        userId,
        timezone,
        scheduledDatetime: scheduledDatetime.toISOString(),
        utcExpirationTime: utcExpirationTime,
        delayMs: delay,
        currentUtc: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to schedule activity expiration:', {
        error,
        activityId,
        userId,
        timezone,
        scheduledDatetime: scheduledDatetime.toISOString(),
      });
      throw error;
    }
  }

  /**
   * Cancel expiration job for an activity
   * 
   * @param activityId - ID of the activity whose expiration job should be cancelled
   * @throws {Error} If cancellation fails
   * @remarks This method will find and remove any pending or delayed jobs for the activity
   */
  public async cancelActivityExpiration(activityId: number) {
    try {
      // Find and remove related jobs
      const jobs = await this.expirationQueue.getJobs(['delayed', 'waiting']);
      for (const job of jobs) {
        if (job.data.activityId === activityId) {
          await job.remove();
          logger.info('Cancelled activity expiration job:', {
            activityId,
            jobId: job.id,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to cancel activity expiration:', {
        error,
        activityId,
      });
      throw error;
    }
  }

  /**
   * Gracefully shut down the expiration queue
   * 
   * @remarks This should be called when the application is shutting down
   * @returns Promise that resolves when the queue is closed
   */
  public async shutdown() {
    await this.expirationQueue.close();
  }
} 