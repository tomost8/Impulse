import { Resolver, Mutation, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Activity, ActivityResponse } from '../schema/activityTypes';
import { CreateActivityInput, UpdateActivityInput } from '../schema/activityInputs';
import { ActivitiesService } from '../../../services/activityService';
import { ValidationError } from '../../common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';

/**
 * GraphQL mutation resolvers for Activity-related operations
 * 
 * This resolver class handles all activity mutations including:
 * - Activity creation with scheduling
 * - Activity updates and status changes
 * - Activity deletion and cleanup
 * 
 * @remarks
 * All mutations return ActivityResponse type that includes:
 * - success: boolean indicating operation success
 * - activity: the affected activity (if applicable)
 * - errors: array of validation or operation errors
 * 
 * @example
 * ```graphql
 * mutation {
 *   createActivity(input: {
 *     userId: 1
 *     scheduledDatetime: "2024-03-20T10:00:00Z"
 *   }) {
 *     success
 *     activity {
 *       id
 *       status
 *       scheduledDatetime
 *     }
 *     errors {
 *       field
 *       message
 *     }
 *   }
 * }
 * ```
 */
@Service()
@Resolver(Activity)
@UseMiddleware(LogOperationMiddleware)
export class ActivityMutations {
  constructor(private activitiesService: ActivitiesService) {}

  /**
   * Mutation to create a new activity with scheduling
   * 
   * This mutation creates a new activity and handles:
   * - Timezone-aware scheduling
   * - Expiration task creation
   * - User validation
   * 
   * @param input - Activity creation data containing required information
   * @returns ActivityResponse with the newly created activity or error details
   * @throws {ValidationError} If user timezone is not set or validation fails
   * 
   * @example
   * ```graphql
   * mutation {
   *   createActivity(input: {
   *     userId: 1
   *     scheduledDatetime: "2024-03-20T10:00:00Z"
   *     category: "event"
   *   }) {
   *     success
   *     activity {
   *       id
   *       status
   *       scheduledDatetime
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => ActivityResponse)
  async createActivity(
    @Arg('input') input: CreateActivityInput
  ): Promise<ActivityResponse> {
    try {
      const activity = await this.activitiesService.create(input);
      return {
        success: true,
        activity
      };
    } catch (error) {
      logger.error('Failed to create activity:', error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create activity'
        }]
      };
    }
  }

  /**
   * Mutation to update an existing activity
   * 
   * This mutation updates an activity's information and handles:
   * - Schedule changes and timezone conversion
   * - Status updates
   * - Expiration task rescheduling
   * 
   * @param id - ID of the activity to update
   * @param input - Updated activity data containing fields to modify
   * @returns ActivityResponse with the updated activity or error details
   * @throws {NotFoundError} If the activity doesn't exist
   * @throws {ValidationError} If validation fails
   * 
   * @example
   * ```graphql
   * mutation {
   *   updateActivity(
   *     id: 1,
   *     input: {
   *       status: "completed"
   *       scheduledDatetime: "2024-03-21T10:00:00Z"
   *     }
   *   ) {
   *     success
   *     activity {
   *       id
   *       status
   *       scheduledDatetime
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => ActivityResponse)
  async updateActivity(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdateActivityInput
  ): Promise<ActivityResponse> {
    try {
      const activity = await this.activitiesService.update(id, input);
      return {
        success: true,
        activity
      };
    } catch (error) {
      logger.error(`Failed to update activity with id ${id}:`, error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update activity'
        }]
      };
    }
  }

  /**
   * Mutation to delete an activity from the system
   * 
   * This mutation permanently removes an activity and handles:
   * - Expiration task cancellation
   * - Related record cleanup
   * - Status updates for linked entities
   * 
   * @param id - ID of the activity to delete
   * @returns ActivityResponse with the deleted activity or error details
   * @throws {NotFoundError} If the activity doesn't exist
   * @remarks This operation cannot be undone
   * 
   * @example
   * ```graphql
   * mutation {
   *   deleteActivity(id: 1) {
   *     success
   *     activity {
   *       id
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => ActivityResponse)
  async deleteActivity(
    @Arg('id', () => Int) id: number
  ): Promise<ActivityResponse> {
    try {
      const activity = await this.activitiesService.delete(id);
      return {
        success: true,
        activity
      };
    } catch (error) {
      logger.error(`Failed to delete activity with id ${id}:`, error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete activity'
        }]
      };
    }
  }
} 