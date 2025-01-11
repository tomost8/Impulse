import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import Queue from 'bull';
import { toZonedTime } from 'date-fns-tz';
import { startOfDay, addDays } from 'date-fns';
import logger from '../config/logger';

interface ActivityExpirationJob {
  activityId: number;
  userId: number;
  timezone: string;
  scheduledDatetime: Date;
}

@Service()
export class ActivityExpirationService {
  private expirationQueue: Queue.Queue<ActivityExpirationJob>;

  constructor(private prisma: PrismaClient) {
    // 创建 Bull 队列
    this.expirationQueue = new Queue<ActivityExpirationJob>('activity-expiration', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      defaultJobOptions: {
        removeOnComplete: true, // 完成后删除任务
        attempts: 3, // 失败重试3次
        backoff: {
          type: 'exponential',
          delay: 1000, // 初始延迟1秒
        },
      },
    });

    // 处理过期任务
    this.expirationQueue.process(async (job) => {
      const { activityId, userId, timezone } = job.data;
      
      try {
        // 更新活动状态为过期
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
        throw error; // 重试机制会处理
      }
    });

    // 错误处理
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
   * 为新活动安排过期任务
   */
  public async scheduleActivityExpiration(
    activityId: number,
    userId: number,
    timezone: string,
    scheduledDatetime: Date
  ) {
    try {
      // 直接用 UTC 时间计算下一天凌晨
      const expirationTime = startOfDay(addDays(scheduledDatetime, 1));

      console.log('expirationTime', expirationTime);

      // 计算延迟时间（毫秒）
      const delay = expirationTime.getTime() - Date.now();
    //   const delay = 10000;
      console.log('delay', delay);
      // 添加到延迟队列
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
        expirationTime: expirationTime.toISOString(),
        delayMs: delay,
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
   * 清理已取消的活动的过期任务
   */
  public async cancelActivityExpiration(activityId: number) {
    try {
      // 查找并删除相关的任务
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
   * 优雅关闭队列
   */
  public async shutdown() {
    await this.expirationQueue.close();
  }
} 