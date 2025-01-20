// src/modules/notification/resolvers/NotificationMutations.ts
import { Resolver, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql';
import { NotificationService } from '../../../services/notificationService';
import { CreateNotificationInput } from '../schema/notificationInputs';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { ValidationError } from '../../../modules/common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import { Service } from 'typedi';

@Service()
@Resolver()
export class NotificationMutations {
  constructor(
    private notificationService: NotificationService
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
    @Arg('communityId') communityId: number,
    @Ctx() context: any,
  ): Promise<boolean> {
    const { id } = context.user;

    return await this.notificationService.sendToCommunity({
      ...input,
      sender_id: id
    }, communityId);
  }
}