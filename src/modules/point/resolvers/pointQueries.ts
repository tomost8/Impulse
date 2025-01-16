import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';
// points
import { Point, PointResponse, PointsResponse } from '../schema/pointTypes';
import { PointsService } from '../../../services/pointService';
// rewards
import { Reward, RewardResponse, RewardsResponse } from '../schema/pointTypes';
import { RewardsService } from '../../../services/pointService';
// redeems
import { Redeem, RedeemResponse, RedeemsResponse } from '../schema/pointTypes';
import { RedeemsService } from '../../../services/pointService';
;


/**
 * GraphQL query resolvers for point-related operations
 */
@Service()
@Resolver(Point)
@UseMiddleware(LogOperationMiddleware)
export class PointQueries {
  constructor(private pointsService: PointsService) {}

  /**
   * Query to fetch point info for a user
   * 
   * @param id - The ID of the user
   * @returns Response containing user point
   * 
   * @example
   * ```graphql
   * query { getPoint(
   * id: 1
   * ) { success point { 
   * 
   * } errors { field message } } }
   * 
   * ```
   */
  @Query(() => PointResponse)
  async getPoint(@Arg('id', () => Int) id: number): Promise<PointResponse> {
    try {
      const point = await this.pointsService.getPoint(id);
      if (!point) {
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `point info for user ID ${id} not found`
          }]
        }
      }
      return {
        success: true,
        point
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch point info'
        }]
      };
    }
  }
}


/**
 * GraphQL query resolvers for reward-related operations
 */
@Service()
@Resolver(Reward)
@UseMiddleware(LogOperationMiddleware)
export class RewardQueries {
  constructor(private rewardsService: RewardsService) {}

  /**
   * Query to fetch all rewards
   * 
   * @returns Response containing rewards
   * 
   * @example
   * ```graphql
   * query { getRewards(
   * ) { success rewards { 
   * 
   * } errors { field message } } }
   * 
   * ```
   */
  @Query(() => RewardsResponse)
  async getRewards(): Promise<RewardsResponse> {
    try {
      const rewards = await this.rewardsService.getRewards();
      if (!rewards) {
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `rewards not found`
          }]
        }
      }
      return {
        success: true,
        rewards
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch rewards'
        }]
      };
    }
  }
}


/**
 * GraphQL query resolvers for redeem-related operations
 */
@Service()
@Resolver(Redeem)
@UseMiddleware(LogOperationMiddleware)
export class RedeemQueries {
  constructor(private redeemsService: RedeemsService) {}

  /**
   * Query to fetch redeems for a user
   * 
   * @param id - The ID of the user
   * @returns Response containing user redeems
   * 
   * @example
   * ```graphql
   * query { getRedeems(
   * id: 1
   * ) { success redeems { 
   * 
   * } errors { field message } } }
   * 
   * ```
   */
  @Query(() => RedeemsResponse)
  async getRedeems(@Arg('id', () => Int) id: number): Promise<RedeemsResponse> {
    try {
      const redeems = await this.redeemsService.getRedeems(id);
      if (!redeems) {
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `redeems for user ID ${id} not found`
          }]
        }
      }
      return {
        success: true,
        redeems
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch redeems'
        }]
      };
    }
  }
}