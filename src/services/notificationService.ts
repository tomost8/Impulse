// src/services/notificationService.ts
import { Service } from 'typedi';
import { PrismaClient, NotificationType } from '@prisma/client';
import { firebaseAdmin } from '../config/firebase';
import { CreateNotificationInput } from '../modules/notification/schema/notificationInputs';
import { ValidationError } from '../modules/common/errors/graphql.error';
import { MulticastMessage } from 'firebase-admin/messaging';
import logger from "../config/logger";

@Service()
export class NotificationService {
  constructor(
    private prisma: PrismaClient
  ) {}

  async broadcastToAll(data: CreateNotificationInput): Promise<boolean> {
    const startTime = Date.now();
    try {
      const notification = await this.prisma.notification.create({
        data: {
          type: NotificationType.ADMIN_BROADCAST,
          title: data.title,
          content: data.content,
          sender: { connect: { id: data.sender_id ?? 0 } }
        }
      });

      logger.info('Broadcast notification created', {
        notification_id: notification.id
      });

      // 3. 获取所有有效的 FCM tokens
      const users = await this.prisma.user.findMany({
        where: {
          fcm_token: { not: null },
          role: 'USER'
        },
        select: {
          id: true,
          fcm_token: true
        }
      });

      // 4. 批量创建通知接收记录
      await this.prisma.notificationRecipient.createMany({
        data: users.map(user => ({
          notification_id: notification.id,
          recipient_id: user.id,
          status: 'PENDING'
        }))
      });

      // 5. 发送 FCM 通知
      const validTokens = users.map(user => user.fcm_token!);
      if (validTokens.length > 0) {
        const BATCH_SIZE = 500;
        for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
          const tokensBatch = validTokens.slice(i, i + BATCH_SIZE);
          console.log("================");
          console.log(tokensBatch);
          const messages: MulticastMessage = {
            tokens: tokensBatch,
            notification: {
              title: data.title,
              body: data.content
            },
            data: {
              notificationId: notification.id.toString(),
              type: NotificationType.ADMIN_BROADCAST
            }
          };

          const response = await firebaseAdmin.messaging().sendEachForMulticast(messages);
          
          console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1}: Successfully sent ${response.successCount}/${tokensBatch.length} messages`);

          // 处理失败的消息
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              logger.error('FCM send failed', {
                notification_id: notification.id,
                token: tokensBatch[idx],
                error: resp.error
              });
            }
          });
        }
      }

      logger.info('Broadcast completed', {
        notification_id: notification.id,
        duration: `${Date.now() - startTime}ms`
      });

      return true;
    } catch (error) {
      console.error('Error sending broadcast notification:', error);
      throw error;
    }
  }


  async sendToCommunity(data: CreateNotificationInput, communityId: number): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // 1. 验证发送者是否是社区管理员
      const isCommunityAdmin = await this.prisma.communityMember.findFirst({
        where: {
          community_id: communityId,
          user_id: data.sender_id ?? 0,
          role: 'ADMIN',
        }
      });

      if (!isCommunityAdmin) {
        logger.warn('Unauthorized community notification attempt', {
          sender_id: data.sender_id,
          community_id: communityId
        });
        throw new ValidationError('Only community admin can send community notifications');
      }

      // 2. 创建通知记录
      const notification = await this.prisma.notification.create({
        data: {
          type: NotificationType.COMMUNITY_NOTICE,
          title: data.title,
          content: data.content,
          sender: { connect: { id: data.sender_id ?? 0 } },
          community_id: communityId
        }
      });

      logger.info('Community notification created', {
        notification_id: notification.id,
        community_id: communityId
      });

      // 3. 获取社区成员
      const communityMembers = await this.prisma.communityMember.findMany({
        where: {
          community_id: communityId,
          status: 'ACCEPTED',
          user: {
            fcm_token: { not: null }
          }
        },
        select: {
          user: {
            select: {
              id: true,
              fcm_token: true
            }
          }
        }
      });

      // 4. 创建接收记录并发送通知
      if (communityMembers.length > 0) {
        // 创建接收记录
        await this.prisma.notificationRecipient.createMany({
          data: communityMembers.map(member => ({
            notification_id: notification.id,
            recipient_id: member.user.id,
            status: 'PENDING'
          }))
        });

        logger.info('Notification recipients created', {
          notification_id: notification.id,
          recipient_count: communityMembers.length
        });

        // 发送 FCM 通知
        const tokens = communityMembers.map(member => member.user.fcm_token!);
        const BATCH_SIZE = 100;

        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
          const batchTokens = tokens.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
          
          try {
            const response = await firebaseAdmin.messaging().sendEachForMulticast({
              tokens: batchTokens,
              notification: {
                title: data.title,
                body: data.content
              },
              data: {
                notificationId: notification.id.toString(),
                type: NotificationType.COMMUNITY_NOTICE,
                communityId: communityId.toString()
              }
            });

            logger.info('FCM batch sent', {
              notification_id: notification.id,
              batch_number: batchNumber,
              success_count: response.successCount,
              failure_count: response.failureCount
            });

          } catch (error) {
            logger.error('FCM batch failed', {
              notification_id: notification.id,
              batch_number: batchNumber,
              error: error instanceof Error ? error.message : 'Unknown error',
              tokens_count: batchTokens.length
            });
          }

          if (i + BATCH_SIZE < tokens.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }

      logger.info('Community notification process completed', {
        notification_id: notification.id,
        duration: `${Date.now() - startTime}ms`,
        recipients_count: communityMembers.length
      });

      return true;
    } catch (error) {
      logger.error('Community notification process failed', {
        community_id: communityId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${Date.now() - startTime}ms`
      });
      throw error;
    }
  }

  /**
   * 获取特定社区的通知列表
   * @param communityId 社区ID
   * @param userId 请求用户ID
   * @param limit 限制返回的通知数量
   * @param offset 分页偏移量
   * @returns 通知列表及总数
   */
  async getCommunityNotifications(communityId: number, userId: number, limit: number = 10, offset: number = 0) {
    try {
      // 验证用户是否是社区成员
      const isCommunityMember = await this.prisma.communityMember.findFirst({
        where: {
          community_id: communityId,
          user_id: userId,
          status: 'ACCEPTED'
        }
      });

      if (!isCommunityMember) {
        throw new ValidationError('User is not a member of this community');
      }

      // 获取社区通知总数
      const totalCount = await this.prisma.notification.count({
        where: {
          type: NotificationType.COMMUNITY_NOTICE,
          community_id: communityId,
          is_active: true
        }
      });

      // 获取社区通知列表
      const notifications = await this.prisma.notification.findMany({
        where: {
          type: NotificationType.COMMUNITY_NOTICE,
          community_id: communityId,
          is_active: true
        },
        include: {
          sender: true,
          recipients: {
            where: {
              recipient_id: userId
            },
            include: {
              recipient: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        skip: offset
      });

      logger.info('Community notifications fetched', {
        community_id: communityId,
        user_id: userId,
        count: notifications.length,
        total_count: totalCount
      });

      return {
        notifications,
        totalCount
      };
    } catch (error) {
      logger.error('Error fetching community notifications', {
        community_id: communityId,
        user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}