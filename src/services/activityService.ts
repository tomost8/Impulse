import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Activity } from '../modules/activity/schema/activityTypes';
import { CreateActivityInput, UpdateActivityInput } from '../modules/activity/schema/activityInputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';

/**
 * Service handling activity-related business logic
 * 
 * This service provides methods for managing activities in the system,
 * including CRUD operations and activity-specific business logic.
 */
@Service()
export class ActivitiesService {
  constructor(private prisma: PrismaClient) {}

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
      console.log('Received postId:', data.postId);

      return await this.prisma.activity.create({
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
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new ValidationError(`Invalid postId: ${data.postId}`);
      }
      throw error;
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
      return await this.prisma.activity.update({
        where: { id },
        data,
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

  async findByUserId(userId: number, options?: { skip?: number; take?: number; }): Promise<Activity[]> {
    return await this.prisma.activity.findMany({
      skip: options?.skip,
      take: options?.take,
      where: {
        userId
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