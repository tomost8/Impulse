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
 * Service handling activity-related business logic and database operations
 * 
 * This service provides methods for managing activities in the system, including:
 * - CRUD operations for activity management
 * - Activity scheduling and expiration handling
 * - Timezone-aware datetime processing
 * - Integration with posts and user management
 * 
 * @remarks
 * Uses Prisma as the ORM and integrates with ActivityExpirationService for scheduling
 */
@Service()
export class ActivitiesService {
  constructor(
    private prisma: PrismaClient,
    private activityExpirationService: ActivityExpirationService
  ) {}

  /**
   * Retrieve activities from the database with optional filtering and pagination
   * 
   * @param options - Query options for filtering and pagination
   * @param options.skip - Number of records to skip
   * @param options.take - Number of records to take
   * @param options.category - Filter activities by category
   * @param options.status - Filter activities by status
   * @returns Promise<Activity[]> Array of activities with their associated posts
   * @throws {PrismaError} If database query fails
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
            author: {
              include: {point: true}
            },
            post_targets: true
          }
        }
      }
    });
  }

  /**
   * Find a specific activity by its ID
   * 
   * @param id - The unique identifier of the activity
   * @returns Promise<Activity> The found activity with associated post data
   * @throws {NotFoundError} If activity doesn't exist
   */
  async findById(id: number): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        post: {
          include: {
            author: {
              include: {point: true}
            },
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
   * Create a new activity with timezone handling and expiration scheduling
   * 
   * @param data - Activity creation data containing required information
   * @returns Promise<Activity> The newly created activity
   * @throws {ValidationError} If validation fails or user timezone is not set
   * @throws {PrismaError} If database operations fail
   * @remarks This method handles timezone conversion and schedules expiration tasks
   */
  async create(data: CreateActivityInput & { userId: number }): Promise<Activity> {
    try {
      // Get user's timezone information
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { timezone: true }
      });

      if (!user?.timezone) {
        throw new ValidationError('User timezone is not set');
      }

      // Use transaction to ensure both activity creation and scheduling succeed
      return await this.prisma.$transaction(async (prisma) => {
        // Create the activity
        const activity = await prisma.activity.create({
          data: {
            ...data,
            status: 'pending'
          },
          include: {
            post: {
              include: {
                author: {
                  include: {point: true}
                },
                post_targets: true
              }
            }
          }
        });

        // Schedule expiration task if scheduled datetime is set
        if (activity.scheduledDatetime) {
          try {
            await this.activityExpirationService.scheduleActivityExpiration(
              activity.id,
              activity.userId,
              user.timezone || 'UTC',
              activity.scheduledDatetime
            );
          } catch (error) {
            // If scheduling fails, throw custom error to trigger transaction rollback
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
      // Log the error for debugging
      logger.error('Failed to create activity:', { error, data });
      
      // Handle specific error types
      if (error instanceof ValidationError) {
        throw error;  // Pass through validation errors
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ValidationError(`Invalid postId: ${data.postId}`);
        }
      }
      
      // Convert other errors to validation error
      throw new ValidationError(
        'Failed to create activity. Please try again.',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Update an existing activity with timezone and expiration handling
   * 
   * @param id - ID of the activity to update
   * @param data - Updated activity data
   * @returns Promise<Activity> The updated activity
   * @throws {NotFoundError} If activity doesn't exist
   * @throws {ValidationError} If validation fails
   * @remarks This method handles rescheduling of expiration tasks if scheduledDatetime changes
   */
  async update(id: number, data: UpdateActivityInput): Promise<Activity> {
    try {
      // Handle scheduledDatetime updates with timezone conversion and task rescheduling
      let utcScheduledDatetime = data.scheduledDatetime;
      if (data.scheduledDatetime) {
        const activity = await this.prisma.activity.findUnique({
          where: { id },
          select: { userId: true }
        });

        if (activity) {
          // Get user's timezone
          const user = await this.prisma.user.findUnique({
            where: { id: activity.userId },
            select: { timezone: true }
          });

          if (user?.timezone) {
            // Cancel existing expiration task
            await this.activityExpirationService.cancelActivityExpiration(id);
            
            // Schedule new expiration task
            await this.activityExpirationService.scheduleActivityExpiration(
              id,
              activity.userId,
              user.timezone,
              data.scheduledDatetime
            );
          }
        }
      }

      // Cancel expiration task if status changes to completed
      if (data.status === 'completed') {
        await this.activityExpirationService.cancelActivityExpiration(id);
      }

      // Update the activity
      return await this.prisma.activity.update({
        where: { id },
        data: {
          ...data,
          scheduledDatetime: utcScheduledDatetime
        },
        include: {
          post: {
            include: {
              author: {
                include: {point: true}
              },
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
   * Delete an activity and cancel its expiration task
   * 
   * @param id - ID of the activity to delete
   * @returns Promise<Activity> The deleted activity
   * @throws {NotFoundError} If activity doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(id: number): Promise<Activity> {
    try {
      // Cancel the expiration task
      await this.activityExpirationService.cancelActivityExpiration(id);

      // Delete the activity
      return await this.prisma.activity.delete({
        where: { id },
        include: {
          post: {
            include: {
              author: {
                include: {point: true}
              },
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

  /**
   * Find all activities for a specific user with optional filtering
   * 
   * @param userId - ID of the user to find activities for
   * @param options - Query options for filtering and pagination
   * @param options.skip - Number of records to skip
   * @param options.take - Number of records to take
   * @param options.status - Filter activities by status
   * @returns Promise<Activity[]> Array of activities for the user
   */
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
            author: {
              include: {point: true}
            },
            post_targets: true
          }
        }
      }
    });
  }

  /**
   * Find activities by date and user ID, matching only the date part of scheduledDatetime
   * 
   * @param date - The date to search for (YYYY-MM-DD format)
   * @param userId - ID of the user whose activities to fetch
   * @param options - Additional query options for filtering and pagination
   * @param options.skip - Number of records to skip
   * @param options.take - Number of records to take
   * @param options.category - Filter activities by category
   * @param options.status - Filter activities by status
   * @returns Promise<Activity[]> Array of activities scheduled for the specified date and user
   */
  async findByDate(
    date: string,
    userId: number,
    options?: {
      skip?: number;
      take?: number;
      category?: string;
      status?: string;
    }
  ): Promise<Activity[]> {
    // Parse the input date
    const searchDate = new Date(date);
    // Create the next day date for range comparison
    const nextDate = new Date(searchDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return await this.prisma.activity.findMany({
      skip: options?.skip,
      take: options?.take,
      where: {
        userId,
        scheduledDatetime: {
          gte: searchDate,
          lt: nextDate,
        },
        ...(options?.category ? { category: options.category } : {}),
        ...(options?.status ? { status: options.status } : {})
      },
      include: {
        post: {
          include: {
            author: {
              include: {point: true}
            },
            post_targets: true
          }
        }
      }
    });
  }
} 