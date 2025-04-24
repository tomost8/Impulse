import { Resolver, Query, Ctx, UseMiddleware, Int, Arg } from 'type-graphql';
import { Service } from 'typedi';
import { PrismaClient, NotificationType, Notification as PrismaNotification } from '@prisma/client';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import { NotificationsResponse, Notification, CommunityNotificationsResponse } from '../schema/notificationTypes';
import { ValidationError } from '../../common/errors/graphql.error';
import { UsersService } from '../../../services/userService';
import { NotificationService } from '../../../services/notificationService';


@Service()
@Resolver()
export class NotificationQueries {
  constructor(
    private prisma: PrismaClient,
    private usersService: UsersService,
    private notificationService: NotificationService
  ) {}

  @Query(() => NotificationsResponse)
  @UseMiddleware(authMiddleware, LogOperationMiddleware)
  async getReminders(
    @Ctx() context: any,
  ): Promise<NotificationsResponse> {
    try {
      const { uid } = context.user;
      const user = await this.usersService.findByFirebaseUid(uid);
      
      if (!user) {
        throw new ValidationError('User not found');
      }

      const notifications = await this.prisma.notification.findMany({
        where: {
          type: NotificationType.REMINDER,
          sender_id: user.id,
          is_active: true
        },
        include: {
          sender: true,
          recipients: {
            include: {
              recipient: true,
              notification: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return {
        success: true,
        notifications: notifications as unknown as Notification[]
      };
    } catch (error) {
      return {
        success: false,
        notifications: [],
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch reminders'
        }]
      };
    }
  }

  @Query(() => NotificationsResponse)
  @UseMiddleware(authMiddleware, LogOperationMiddleware)
  async getReminderById(
    @Arg('id', () => Int) id: number,
    @Ctx() context: any,
  ): Promise<NotificationsResponse> {
    try {
      const { uid } = context.user;
      const user = await this.usersService.findByFirebaseUid(uid);
      
      if (!user) {
        throw new ValidationError('User not found');
      }

      const notification = await this.prisma.notification.findFirst({
        where: {
          id,
          type: NotificationType.REMINDER,
          sender_id: user.id
        },
        include: {
          sender: true,
          recipients: {
            include: {
              recipient: true,
              notification: true
            }
          }
        }
      });

      if (!notification) {
        throw new ValidationError('Reminder not found or unauthorized');
      }

      return {
        success: true,
        notifications: [notification as unknown as Notification]
      };
    } catch (error) {
      return {
        success: false,
        notifications: [],
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch reminder'
        }]
      };
    }
  }

  @Query(() => CommunityNotificationsResponse)
  @UseMiddleware(authMiddleware, LogOperationMiddleware)
  async getCommunityNotifications(
    @Arg('communityId', () => Int) communityId: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { nullable: true, defaultValue: 0 }) offset: number,
    @Ctx() context: any,
  ): Promise<CommunityNotificationsResponse> {
    try {
      const { uid } = context.user;
      const user = await this.usersService.findByFirebaseUid(uid);
      
      if (!user) {
        throw new ValidationError('User not found');
      }

      const { notifications, totalCount } = await this.notificationService.getCommunityNotifications(
        communityId,
        user.id,
        limit,
        offset
      );

      return {
        success: true,
        notifications: notifications as unknown as Notification[],
        totalCount
      };
    } catch (error) {
      return {
        success: false,
        notifications: [],
        totalCount: 0,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch community notifications'
        }]
      };
    }
  }
} 