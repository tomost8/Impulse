// src/modules/notification/resolvers/NotificationMutations.ts
import { Resolver, Mutation, Arg, Ctx, UseMiddleware, Int } from 'type-graphql';
import { NotificationService } from '../../../services/notificationService';
import { CreateNotificationInput } from '../schema/notificationInputs';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { ValidationError } from '../../common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import { Service } from 'typedi';
import { UsersService } from '../../../services/userService';
import { ReminderService } from '../../../services/reminderService';
import { NotificationType, PrismaClient } from '@prisma/client';

@Service()
@Resolver()
export class NotificationMutations {
  constructor(
    private notificationService: NotificationService,
    private usersService: UsersService,
    private reminderService: ReminderService,
    private prisma: PrismaClient
  ) {}

  @Mutation(() => Boolean)
  @UseMiddleware(authMiddleware, LogOperationMiddleware)
  async sendBroadcastNotification(
    @Arg('input') input: CreateNotificationInput,
    @Ctx() context: any,
  ): Promise<boolean> {
    const { role } = context.user;
    if (role !== 'ADMIN') {
      throw new ValidationError('Only admin can send broadcast notifications');
    }

    return await this.notificationService.broadcastToAll({
      ...input
    });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(authMiddleware, LogOperationMiddleware)
  async sendCommunityNotification(
    @Arg('input') input: CreateNotificationInput,
    @Arg('communityId', () => Int) communityId: number,
    @Ctx() context: any,
  ): Promise<boolean> {
    const { uid } = context.user;

    const user = await this.usersService.findByFirebaseUid(uid);
    if (!user) {
      throw new ValidationError('User not found');
    }

    return await this.notificationService.sendToCommunity({
      ...input,
      sender_id: user.id
    }, communityId);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(authMiddleware, LogOperationMiddleware)
  async createReminder(
    @Arg('input') input: CreateNotificationInput,
    @Ctx() context: any,
  ): Promise<boolean> {
    const { uid } = context.user;
    const user = await this.usersService.findByFirebaseUid(uid);
    
    if (!user) {
      throw new ValidationError('User not found');
    }

    return await this.reminderService.createReminder({
      ...input,
      sender_id: user.id
    });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(authMiddleware, LogOperationMiddleware)
  async cancelReminder(
    @Arg('notificationId', () => Int) notificationId: number,
    @Ctx() context: any,
  ): Promise<boolean> {
    const { uid } = context.user;
    const user = await this.usersService.findByFirebaseUid(uid);
    
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Verify the reminder belongs to the user
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        type: NotificationType.REMINDER,
        sender_id: user.id
      }
    });

    if (!notification) {
      throw new ValidationError('Reminder not found or unauthorized');
    }

    return await this.reminderService.cancelReminder(notificationId);
  }
}