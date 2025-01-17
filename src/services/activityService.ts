import { Service } from 'typedi';
import { PrismaClient, Prisma } from '@prisma/client';
import { Activity } from '../modules/activity/schema/activityTypes';
import { CreateActivityInput, UpdateActivityInput } from '../modules/activity/schema/activityInputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import { ActivityExpirationService } from './activityExpirationService';
import logger from '../config/logger';
import { parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Service handling activity-related business logic
 * 
 * This service provides methods for managing activities in the system,
 * including CRUD operations and activity-specific business logic.
 */
@Service()
export class ActivitiesService {
  constructor(
    private prisma: PrismaClient,
    private activityExpirationService: ActivityExpirationService
  ) {}


  /**
   * Retrieve activities from the database with optional filtering
   * 
   * @param options - Filter and pagination options
   * @returns Promise resolving to an array of activities
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    category?: string;
    status?: string;
  }): Promise<Activity[]> {
    return await this.prisma.activity.findMany({
      skip: options?.skip,
      take: options?.take,
      where: {
        category: options?.category,
        status: options?.status
      },
      include: {
        post: {
          include: {
            author: true,
            post_targets: true
          }
        }
      }
    });
  }

  /**
   * Find an activity by its ID
   * 
   * @param id - The unique identifier of the activity
   * @returns Promise resolving to the activity
   * @throws {NotFoundError} If activity doesn't exist
   */
  async findById(id: number): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        post: {
          include: {
            author: true,
            post_targets: true
          }
        }
      }
    });

    if (!activity) {
      throw new NotFoundError(`Activity with id ${id} not found`);
    }

    return activity;
  }

  /**
   * Create a new activity
   * 
   * @param data - Activity creation data
   * @returns Promise resolving to the created activity
   * @throws {ValidationError} If validation fails
   */
  async create(data: CreateActivityInput): Promise<Activity> {
    try {
      // 1. 获取用户的时区信息
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { timezone: true }
      });

      if (!user?.timezone) {
        throw new ValidationError('User timezone is not set');
      }

      // 使用事务确保活动创建和队列调度都成功
      return await this.prisma.$transaction(async (prisma) => {
        // 2. 创建活动
        const activity = await prisma.activity.create({
          data: {
            ...data,
            status: 'pending'
          },
          include: {
            post: {
              include: {
                author: true,
                post_targets: true
              }
            }
          }
        });

        // 3. 如果有预定时间，调度过期任务
        if (activity.scheduledDatetime) {
          try {
            await this.activityExpirationService.scheduleActivityExpiration(
              activity.id,
              activity.userId,
              user.timezone || 'UTC',
              activity.scheduledDatetime
            );
          } catch (error) {
            // 如果调度失败，抛出自定义错误，事务会回滚
            throw new ValidationError(
              'Failed to schedule activity expiration. Please try again.',
              {
                activityId: activity.id,
                userId: activity.userId,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            );
          }
        }

        return activity;
      });
    } catch (error) {
      // 记录错误
      logger.error('Failed to create activity:', { error, data });
      
      // 转换错误类型
      if (error instanceof ValidationError) {
        throw error;  // 直接传递验证错误
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ValidationError(`Invalid postId: ${data.postId}`);
        }
      }
      
      // 其他错误转换为通用错误
      throw new ValidationError(
        'Failed to create activity. Please try again.',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Update an existing activity
   * 
   * @param id - ID of the activity to update
   * @param data - Updated activity data
   * @returns Promise resolving to the updated activity
   * @throws {NotFoundError} If activity doesn't exist
   */
  async update(id: number, data: UpdateActivityInput): Promise<Activity> {
    try {
      // 1. 如果更新包含scheduledDatetime，需要处理时区转换和重新安排过期任务
      let utcScheduledDatetime = data.scheduledDatetime;
      if (data.scheduledDatetime) {
        const activity = await this.prisma.activity.findUnique({
          where: { id },
          select: { userId: true }
        });

        if (activity) {
          // 获取用户时区
          const user = await this.prisma.user.findUnique({
            where: { id: activity.userId },
            select: { timezone: true }
          });

          if (user?.timezone) {
            // 取消旧的过期任务
            await this.activityExpirationService.cancelActivityExpiration(id);
            
            // 创建新的过期任务
            await this.activityExpirationService.scheduleActivityExpiration(
              id,
              activity.userId,
              user.timezone,
              data.scheduledDatetime
            );
          }
        }
      }

      // 如果状态变更为completed，取消对应的bull任务
      if (data.status === 'completed') {
        await this.activityExpirationService.cancelActivityExpiration(id);
      }

      // 2. 更新活动
      return await this.prisma.activity.update({
        where: { id },
        data: {
          ...data,
          scheduledDatetime: utcScheduledDatetime
        },
        include: {
          post: {
            include: {
              author: true,
              post_targets: true
            }
          }
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Activity with id ${id} not found`);
      }
      if (error.code === 'P2003') {
        throw new ValidationError(`Invalid postId: ${data.postId}`);
      }
      throw error;
    }
  }

  /**
   * Delete an activity from the system
   * 
   * @param id - ID of the activity to delete
   * @returns Promise resolving to the deleted activity
   * @throws {NotFoundError} If activity doesn't exist
   */
  async delete(id: number): Promise<Activity> {
    try {
      // 1. 取消过期任务
      await this.activityExpirationService.cancelActivityExpiration(id);

      // 2. 删除活动
      return await this.prisma.activity.delete({
        where: { id },
        include: {
          post: {
            include: {
              author: true,
              post_targets: true
            }
          }
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Activity with id ${id} not found`);
      }
      throw error;
    }
  }

  async findByUserId(
    userId: number, 
    options?: { 
      skip?: number; 
      take?: number;
      status?: string;
    }
  ): Promise<Activity[]> {
    return await this.prisma.activity.findMany({
      skip: options?.skip,
      take: options?.take,
      where: {
        userId,
        ...(options?.status ? { status: options.status } : {})
      },
      include: {
        post: {
          include: {
            author: true,
            post_targets: true
          }
        }
      }
    });
  }
} 