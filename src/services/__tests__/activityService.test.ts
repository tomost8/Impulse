import 'reflect-metadata';
import { Container } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ActivitiesService } from '../activityService';
import { ActivityExpirationService } from '../activityExpirationService';
import { ValidationError } from '../../modules/common/errors/graphql.error';

describe('ActivitiesService', () => {
  let activitiesService: ActivitiesService;
  let prisma: DeepMockProxy<PrismaClient>;
  let activityExpirationService: DeepMockProxy<ActivityExpirationService>;

  beforeEach(() => {
    // Mock Prisma
    prisma = mockDeep<PrismaClient>();
    Container.set(PrismaClient, prisma);

    // Mock ActivityExpirationService
    activityExpirationService = mockDeep<ActivityExpirationService>();
    Container.set(ActivityExpirationService, activityExpirationService);

    // Create service instance
    activitiesService = new ActivitiesService(prisma, activityExpirationService);
  });

  describe('create', () => {
    it('should convert local time to UTC when creating activity', async () => {
      // 模拟用户数据
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        timezone: 'Asia/Shanghai',
        email: 'test@example.com',
        firebase_uid: 'test-uid',
        first_name: null,
        last_name: null,
        username: null,
        dob: null,
        gender: null,
        profile_picture: null,
        role: 'user',
        status: 'active',
        searchable: true,
        fcm_token: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      });

      // 模拟创建活动
      const localDateTime = new Date('2024-01-22T15:00:00+08:00'); // 上海时间下午3点
      const expectedUtcTime = new Date('2024-01-22T07:00:00Z'); // UTC 时间应该是早上7点

      prisma.activity.create.mockResolvedValue({
        id: 1,
        name: '测试活动',
        description: null,
        category: 'social',
        duration: null,
        scheduledDatetime: expectedUtcTime,
        status: 'pending',
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
      });

      // 执行创建
      const result = await activitiesService.create({
        name: '测试活动',
        category: 'social',
        userId: 1,
        scheduledDatetime: localDateTime,
      });

      // 验证转换后的时间
      expect(prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduledDatetime: expectedUtcTime,
          }),
        })
      );

      // 验证过期任务的创建
      expect(activityExpirationService.scheduleActivityExpiration).toHaveBeenCalledWith(
        1,
        1,
        'Asia/Shanghai',
        expectedUtcTime
      );
    });

    it('should throw error if user timezone is not set', async () => {
      // 模拟没有时区的用户
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        timezone: null,
        email: 'test@example.com',
        firebase_uid: 'test-uid',
        first_name: null,
        last_name: null,
        username: null,
        dob: null,
        gender: null,
        profile_picture: null,
        role: 'user',
        status: 'active',
        searchable: true,
        fcm_token: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      });

      // 验证错误抛出
      await expect(activitiesService.create({
        name: '测试活动',
        category: 'social',
        userId: 1,
        scheduledDatetime: new Date(),
      })).rejects.toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('should handle timezone conversion when updating scheduledDatetime', async () => {
      // 模拟现有活动
      prisma.activity.findUnique.mockResolvedValue({
        id: 1,
        userId: 1,
        name: '测试活动',
        description: null,
        category: 'social',
        duration: null,
        scheduledDatetime: new Date('2024-01-22T07:00:00Z'),
        status: 'pending',
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 模拟用户数据
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        timezone: 'Asia/Shanghai',
        email: 'test@example.com',
        firebase_uid: 'test-uid',
        first_name: null,
        last_name: null,
        username: null,
        dob: null,
        gender: null,
        profile_picture: null,
        role: 'user',
        status: 'active',
        searchable: true,
        fcm_token: null,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      });

      // 模拟更新
      const newLocalDateTime = new Date('2024-01-22T16:00:00+08:00'); // 上海时间下午4点
      const expectedUtcTime = new Date('2024-01-22T08:00:00Z'); // UTC 时间应该是早上8点

      prisma.activity.update.mockResolvedValue({
        id: 1,
        name: '测试活动',
        description: null,
        category: 'social',
        duration: null,
        scheduledDatetime: expectedUtcTime,
        status: 'pending',
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
      });

      // 执行更新
      await activitiesService.update(1, {
        scheduledDatetime: newLocalDateTime,
      });

      // 验证是否取消了旧的过期任务
      expect(activityExpirationService.cancelActivityExpiration).toHaveBeenCalledWith(1);

      // 验证是否创建了新的过期任务
      expect(activityExpirationService.scheduleActivityExpiration).toHaveBeenCalledWith(
        1,
        1,
        'Asia/Shanghai',
        expectedUtcTime
      );

      // 验证更新的时间
      expect(prisma.activity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            scheduledDatetime: expectedUtcTime,
          }),
        })
      );
    });
  });

  describe('delete', () => {
    it('should cancel expiration task when deleting activity', async () => {
      // 模拟删除操作
      prisma.activity.delete.mockResolvedValue({
        id: 1,
        name: '测试活动',
        description: null,
        category: 'social',
        duration: null,
        scheduledDatetime: new Date(),
        status: 'pending',
        postId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
      });

      // 执行删除
      await activitiesService.delete(1);

      // 验证是否取消了过期任务
      expect(activityExpirationService.cancelActivityExpiration).toHaveBeenCalledWith(1);
    });
  });
}); 