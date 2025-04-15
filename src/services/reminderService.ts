import { Service } from 'typedi';
import { PrismaClient, NotificationType, NotificationScheduleType } from '@prisma/client';
import Queue from 'bull';
import { firebaseAdmin } from '../config/firebase';
import { CreateNotificationInput } from '../modules/notification/schema/notificationInputs';
import logger from '../config/logger';
import { ValidationError } from '../modules/common/errors/graphql.error';

@Service()
export class ReminderService {
  public reminderQueue: Queue.Queue;

  constructor(
    private prisma: PrismaClient
  ) {
    // Initialize the Bull queue for reminders
    this.reminderQueue = new Queue('reminders', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    // Process reminder jobs
    this.reminderQueue.process(async (job) => {
      if (job.data.type === 'DAILY_ACTIVE_CHECK') {
        await this.processDailyActiveUserCheck();
        return;
      }
      await this.processReminder(job.data);
    });

    // Clean up completed jobs
    this.reminderQueue.on('completed', async (job) => {
      const { schedule_type } = job.data;
      if (schedule_type === NotificationScheduleType.ONCE) {
        await job.remove();
      }
    });
  }

  /**
   * Create a new reminder notification
   */
  async createReminder(data: CreateNotificationInput): Promise<boolean> {
    try {
      // Validate schedule time
      if (!data.schedule_time) {
        throw new ValidationError('Schedule time is required for reminders');
      }

      // Create notification record
      const notification = await this.prisma.notification.create({
        data: {
          type: NotificationType.REMINDER,
          title: data.title,
          content: data.content,
          sender: { connect: { id: data.sender_id ?? 0 } },
          schedule_type: data.schedule_type as NotificationScheduleType,
          schedule_time: data.schedule_time,
          is_active: true
        }
      });

      // Create notification recipient record
      await this.prisma.notificationRecipient.create({
        data: {
          notification_id: notification.id,
          recipient_id: data.sender_id ?? 0,
          status: 'PENDING'
        }
      });

      // Schedule the reminder based on schedule_type
      await this.scheduleReminder(notification);

      logger.info('Reminder created', {
        notification_id: notification.id,
        schedule_type: data.schedule_type,
        schedule_time: data.schedule_time
      });

      return true;
    } catch (error) {
      logger.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Schedule a reminder using Bull queue
   */
  private async scheduleReminder(notification: any) {
    const scheduleTime = new Date(notification.schedule_time);
    const now = new Date();

    // Calculate initial delay
    let delay = scheduleTime.getTime() - now.getTime();
    if (delay < 0) {
      // If schedule time is in the past, adjust for the next occurrence
      switch (notification.schedule_type) {
        case NotificationScheduleType.DAILY:
          scheduleTime.setDate(scheduleTime.getDate() + 1);
          break;
        case NotificationScheduleType.WEEKLY:
          scheduleTime.setDate(scheduleTime.getDate() + 7);
          break;
        case NotificationScheduleType.MONTHLY:
          scheduleTime.setMonth(scheduleTime.getMonth() + 1);
          break;
      }
      delay = scheduleTime.getTime() - now.getTime();
    }

    // Create job options based on schedule type
    const jobOptions: Queue.JobOptions = {
      delay,
      removeOnComplete: notification.schedule_type === NotificationScheduleType.ONCE
    };

    // Add repeat options for recurring reminders
    if (notification.schedule_type !== NotificationScheduleType.ONCE) {
      jobOptions.repeat = {
        cron: this.generateCronExpression(notification.schedule_time, notification.schedule_type)
      };
    }

    // Add to queue
    await this.reminderQueue.add(
      {
        notification_id: notification.id,
        schedule_type: notification.schedule_type
      },
      jobOptions
    );
  }

  /**
   * Process a reminder notification
   */
  private async processReminder(data: { notification_id: number; schedule_type: NotificationScheduleType }) {
    try {
      // Get notification details
      const notification = await this.prisma.notification.findUnique({
        where: { id: data.notification_id },
        include: {
          recipients: {
            include: {
              recipient: true
            }
          }
        }
      });

      if (!notification || !notification.is_active) {
        return;
      }

      // Send FCM notification to recipient
      for (const recipient of notification.recipients) {
        if (recipient.recipient.fcm_token) {
          try {
            await firebaseAdmin.messaging().send({
              token: recipient.recipient.fcm_token,
              notification: {
                title: notification.title,
                body: notification.content
              },
              data: {
                notificationId: notification.id.toString(),
                type: NotificationType.REMINDER
              }
            });

            // Update recipient status
            await this.prisma.notificationRecipient.update({
              where: { id: recipient.id },
              data: {
                status: 'SENT',
                sent_at: new Date()
              }
            });
          } catch (error) {
            logger.error('Failed to send FCM notification:', error);
            await this.prisma.notificationRecipient.update({
              where: { id: recipient.id },
              data: {
                status: 'FAILED',
                error_message: error instanceof Error ? error.message : 'Unknown error'
              }
            });
          }
        }
      }

      // Update last sent time
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { last_sent: new Date() }
      });
    } catch (error) {
      logger.error('Error processing reminder:', error);
      throw error;
    }
  }

  /**
   * Generate cron expression based on schedule time and type
   */
  private generateCronExpression(scheduleTime: Date, scheduleType: NotificationScheduleType): string {
    const minutes = scheduleTime.getMinutes();
    const hours = scheduleTime.getHours();
    const dayOfMonth = scheduleTime.getDate();

    switch (scheduleType) {
      case NotificationScheduleType.DAILY:
        return `${minutes} ${hours} * * *`;
      case NotificationScheduleType.WEEKLY:
        const dayOfWeek = scheduleTime.getDay();
        return `${minutes} ${hours} * * ${dayOfWeek}`;
      case NotificationScheduleType.MONTHLY:
        return `${minutes} ${hours} ${dayOfMonth} * *`;
      default:
        throw new Error('Invalid schedule type');
    }
  }

  /**
   * Cancel an active reminder
   */
  async cancelReminder(notificationId: number): Promise<boolean> {
    try {
      // Get all jobs in the queue
      const jobs = await this.reminderQueue.getJobs(['waiting', 'delayed', 'active']);
      
      // Find and remove the job for this notification
      for (const job of jobs) {
        if (job.data.notification_id === notificationId) {
          await job.remove();
          break;
        }
      }

      // Update notification status
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { is_active: false }
      });

      return true;
    } catch (error) {
      logger.error('Error canceling reminder:', error);
      throw error;
    }
  }

  /**
   * Setup daily active user check reminder
   */
  async setupDailyActiveUserCheck(): Promise<void> {
    const jobOptions: Queue.JobOptions = {
      repeat: {
        cron: '0 * * * *' // Every hour
      }
    };

    await this.reminderQueue.add(
      {
        type: 'DAILY_ACTIVE_CHECK',
        schedule_type: NotificationScheduleType.DAILY
      },
      jobOptions
    );

    logger.info('Daily active user check reminder setup completed');
  }

  /**
   * Process daily active user check
   */
  private async processDailyActiveUserCheck(): Promise<void> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          status: 'active',
          timezone: { not: null },
          fcm_token: { not: null }
        },
        select: {
          id: true,
          timezone: true,
          fcm_token: true
        }
      });

      const now = new Date();
      const usersAt9AM = users.filter(user => {
        const userLocalTime = new Date(now.toLocaleString('en-US', { timeZone: user.timezone! }));
        return userLocalTime.getHours() === 9;
      });

      for (const user of usersAt9AM) {
        try {
          await firebaseAdmin.messaging().send({
            token: user.fcm_token!,
            notification: {
              title: '',
              body: ''
            },
            data: {
              type: 'DAILY_ACTIVE_CHECK'
            }
          });

          logger.info('Daily active check notification sent', { user_id: user.id });
        } catch (error) {
          logger.error('Failed to send daily active check notification:', {
            user_id: user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      logger.error('Error processing daily active user check:', error);
      throw error;
    }
  }
} 