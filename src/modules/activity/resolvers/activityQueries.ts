import { Resolver, Query, Arg, Int, UseMiddleware, Ctx } from 'type-graphql';
import { Service } from 'typedi';
import { Activity, ActivityResponse, ActivitiesResponse } from '../schema/activityTypes';
import { ActivitiesService } from '../../../services/activityService';
import { UsersService } from '../../../services/userService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';
import { AuthContext, authMiddleware } from '../../../middleware/authMiddleware';

@Service()
@Resolver(Activity)
@UseMiddleware(LogOperationMiddleware)
export class ActivityQueries {
  constructor(private activitiesService: ActivitiesService) {}

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

  @Query(() => ActivityResponse)
  async activity(@Arg('id', () => Int) id: number): Promise<ActivityResponse> {
    try {
      console.log("this is user ID", id);

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