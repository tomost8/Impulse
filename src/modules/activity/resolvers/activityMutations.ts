import { Resolver, Mutation, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Activity, ActivityResponse } from '../schema/activityTypes';
import { CreateActivityInput, UpdateActivityInput } from '../schema/activityInputs';
import { ActivitiesService } from '../../../services/activityService';
import { ValidationError } from '../../common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';

@Service()
@Resolver(Activity)
@UseMiddleware(LogOperationMiddleware)
export class ActivityMutations {
  constructor(private activitiesService: ActivitiesService) {}

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