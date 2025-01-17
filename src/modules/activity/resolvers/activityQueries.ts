import { Resolver, Query, Arg, Int, UseMiddleware, Ctx } from 'type-graphql';
import { Service } from 'typedi';
import { Activity, ActivityResponse, ActivitiesResponse } from '../schema/activityTypes';
import { ActivitiesService } from '../../../services/activityService';
import { UsersService } from '../../../services/userService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';
import { AuthContext, authMiddleware } from '../../../middleware/authMiddleware';

/**
 * GraphQL query resolvers for Activity-related operations
 * 
 * This resolver class provides queries for retrieving activity information:
 * - List of activities with filtering and pagination
 * - Single activity lookup
 * - User-specific activity lists
 * - Status-based activity filtering
 * 
 * @remarks
 * All queries return either ActivityResponse or ActivitiesResponse types that include:
 * - success: boolean indicating operation success
 * - activity/activities: the requested activity data
 * - errors: array of validation or operation errors
 * 
 * @example
 * ```graphql
 * query {
 *   activities(
 *     category: "event"
 *     status: "pending"
 *   ) {
 *     success
 *     activities {
 *       id
 *       status
 *       scheduledDatetime
 *       post {
 *         caption
 *       }
 *     }
 *   }
 * }
 * ```
 */
@Service()
@Resolver(Activity)
@UseMiddleware(LogOperationMiddleware)
export class ActivityQueries {
  constructor(private activitiesService: ActivitiesService) {}

  /**
   * Query to fetch activities with filtering and pagination
   * 
   * This query supports multiple filtering criteria:
   * - Category-based filtering
   * - Status filtering
   * - Pagination options
   * 
   * @param skip - Number of records to skip (pagination)
   * @param take - Number of records to take (pagination)
   * @param category - Filter activities by category
   * @param status - Filter activities by status
   * @returns ActivitiesResponse containing filtered activities or error details
   * @throws {ValidationError} If filter parameters are invalid
   * 
   * @example
   * ```graphql
   * query {
   *   activities(
   *     category: "event"
   *     status: "pending"
   *     skip: 0
   *     take: 10
   *   ) {
   *     success
   *     activities {
   *       id
   *       status
   *       scheduledDatetime
   *     }
   *   }
   * }
   * ```
   */
  @Query(() => ActivitiesResponse)
  async activities(
    @Arg('skip', () => Int, { nullable: true }) skip?: number,
    @Arg('take', () => Int, { nullable: true }) take?: number,
    @Arg('category', { nullable: true }) category?: string,
    @Arg('status', { nullable: true }) status?: string
  ): Promise<ActivitiesResponse> {
    try {
      const activities = await this.activitiesService.findAll({
        skip,
        take,
        category,
        status
      });
      return {
        success: true,
        activities
      };
    } catch (error) {
      logger.error('Failed to fetch activities:', error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch activities'
        }]
      };
    }
  }

  /**
   * Query to fetch a single activity by ID
   * 
   * This query retrieves detailed information about a specific activity,
   * including associated post data if available.
   * 
   * @param id - ID of the activity to fetch
   * @returns ActivityResponse containing the activity or error details
   * @throws {NotFoundError} If the activity doesn't exist
   * 
   * @example
   * ```graphql
   * query {
   *   activity(id: 1) {
   *     success
   *     activity {
   *       id
   *       status
   *       scheduledDatetime
   *       post {
   *         caption
   *         mediaUrl
   *       }
   *     }
   *   }
   * }
   * ```
   */
  @Query(() => ActivityResponse)
  async activity(@Arg('id', () => Int) id: number): Promise<ActivityResponse> {
    try {
      const activity = await this.activitiesService.findById(id);
      return {
        success: true,
        activity
      };
    } catch (error) {
      logger.error(`Failed to fetch activity with id ${id}:`, error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch activity'
        }]
      };
    }
  }

  /**
   * Query to fetch all activities for a specific user
   * 
   * This query retrieves activities associated with a particular user,
   * with support for status filtering and pagination.
   * 
   * @param userId - ID of the user whose activities to fetch
   * @param skip - Number of records to skip (pagination)
   * @param take - Number of records to take (pagination)
   * @param status - Filter activities by status
   * @returns ActivitiesResponse containing user's activities or error details
   * @throws {ValidationError} If userId is invalid
   * 
   * @example
   * ```graphql
   * query {
   *   activitiesByUserId(
   *     userId: 1
   *     status: "pending"
   *     skip: 0
   *     take: 10
   *   ) {
   *     success
   *     activities {
   *       id
   *       status
   *       scheduledDatetime
   *     }
   *   }
   * }
   * ```
   */
  @Query(() => ActivitiesResponse)
  async activitiesByUserId(
    @Arg('userId', () => Int) userId: number,
    @Arg('skip', () => Int, { nullable: true }) skip?: number,
    @Arg('take', () => Int, { nullable: true }) take?: number,
    @Arg('status', { nullable: true }) status?: string
  ): Promise<ActivitiesResponse> {
    try {
      const activities = await this.activitiesService.findByUserId(userId, { skip, take, status });
      return {
        success: true,
        activities
      };
    } catch (error) {
      logger.error(`Failed to fetch activities for user with id ${userId}:`, error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch activities'
        }]
      };
    }
  }
} 