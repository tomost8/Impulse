import { Resolver, Mutation, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { ValidationError } from '../../common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';
// points
import { Point, PointResponse } from '../schema/pointTypes';
import { UpdatePointInput } from '../schema/pointInputs';
import { PointsService } from '../../../services/pointService';
// rewards
import { Reward, RewardResponse } from '../schema/pointTypes';
import { CreateRewardInput, UpdateRewardInput } from '../schema/pointInputs';
import { RewardsService } from '../../../services/pointService';
// redeems
import { Redeem, RedeemResponse } from '../schema/pointTypes';
import { CreateRedeemInput, UpdateRedeemInput } from '../schema/pointInputs';
import { RedeemsService } from '../../../services/pointService';


/**
 * GraphQL mutation resolvers for friends + friend request operations
 */
@Service()
@Resolver(Point)
@UseMiddleware(LogOperationMiddleware)
export class PointMutations {
  constructor(private pointsService: PointsService) {}

  /**
   * Mutation to update user point info
   * 
   * @param id - ID of the user
   * @param input - Updated point info
   * @returns Response containing the updated point info or error details
   * 
   * @example
   * ```graphql
   * mutation { updatePoint(
   * id: 1, input: { point_added: 100}
   * ) { success point { 
   * user { id first_name last_name } points spending_points weekly_points monthly_points
   * } errors { field message } } }
   * ```
   */
  @Mutation(() => PointResponse)
  async updatePoint(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdatePointInput
  ): Promise<PointResponse> {
    try {
      const point = await this.pointsService.update(id, input);
      
      logger.info('Point relation update successful', { 
        userId: point.user_id,
        updates: input 
      });

      return {
        success: true,
        point
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update point relation'
        }]
      };
    }
  }
} 



/**
 * GraphQL mutation resolvers for reward operations
 */
@Service()
@Resolver(Reward)
@UseMiddleware(LogOperationMiddleware)
export class RewardMutations {
  constructor(private rewardsService: RewardsService) {}

  /**
   * Mutation to create a reward (backend only)
   * 
   * @param input - reward data
   * @returns Response containing the newly created reward or error details
   * 
   * @example
   * ```graphql
   * mutation { createReward(
   * input: { title: "gift card", description: "$10", required_points: 7500}
   * ) { success reward { 
   * id title description required_points
   * } errors { field message } } }
   * ```
   */
  @Mutation(() => RewardResponse)
  async createReward(@Arg('input') input: CreateRewardInput): Promise<RewardResponse> {
    try {
      const reward = await this.rewardsService.create(input);
      
      logger.info('Reward creation successful', { 
        title: reward.title,
        points: reward.required_points
      });

      return {
        success: true,
        reward
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create reward'
        }]
      };
    }
  }

  /**
   * Mutation to update a reward
   * 
   * @param id - ID of the reward
   * @param input - Updated reward status data
   * @returns Response containing the updated reward or error details
   * 
   * @example
   * ```graphql
   * mutation { updateReward(
   * id: 1, input: { description: "$15", required_points: 10000 }
   * ) { success reward { 
   * id title description required_points
   * } errors { field message } } }
   * ```
   */
  @Mutation(() => RewardResponse)
  async updateReward(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdateRewardInput
  ): Promise<RewardResponse> {
    try {
      const reward = await this.rewardsService.update(id, input);
      
      logger.info('Reward update successful', { 
        rewardId: id,
        updates: input 
      });

      return {
        success: true,
        reward
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update reward'
        }]
      };
    }
  }

  /**
   * Mutation to remove a reward
   * 
   * @param id - id of the reward
   * @returns Response indicating success or failure
   * 
   * @example
   * ```graphql
   * mutation { deleteReward(
   * id: 1
   * ) { success
   * errors { field message } } }
   * ```
   */
  @Mutation(() => RewardResponse)
  async deleteReward(
    @Arg('id', () => Int) id: number,
  ): Promise<RewardResponse> {
    try {
      await this.rewardsService.delete(id);

      logger.info('Reward deletion successful', { 
        rewardId: id
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete reward'
        }]
      };
    }
  }
} 





/**
 * GraphQL mutation resolvers for redeem operations
 */
@Service()
@Resolver(Redeem)
@UseMiddleware(LogOperationMiddleware)
export class RedeemMutations {
  constructor(private redeemsService: RedeemsService) {}

  /**
   * Mutation to create a redeem
   * 
   * @param input - redeem data
   * @returns Response containing the newly created redeem or error details
   * 
   * @example
   * ```graphql
   * mutation { createRedeem(
   * input: { user_id: 3, reward_id: 2 }
   * ) { success redeem { 
   * id user { id first_name last_name } reward { id title description required_points } points_spent status
   * } errors { field message } } }
   * ```
   */
  @Mutation(() => RedeemResponse)
  async createRedeem(@Arg('input') input: CreateRedeemInput): Promise<RedeemResponse> {
    try {
      const redeem = await this.redeemsService.create(input);
      
      logger.info('Redeem creation successful', { 
        userId: input.user_id,
        rewardId: input.reward_id
      });

      return {
        success: true,
        redeem
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create redeem'
        }]
      };
    }
  }

  /**
   * Mutation to update a redeem (backend only)
   * 
   * @param id - ID of the redeem
   * @param input - Updated redeem status data
   * @returns Response containing the updated redeem or error details
   * 
   * @example
   * ```graphql
   * mutation { updateRedeem(
   * id: 1, input: { status: "ACCEPTED" }
   * ) { success redeem { 
   * id user { id first_name last_name } reward { id title description required_points } points_spent status
   * } errors { field message } } }
   * ```
   */
  @Mutation(() => RedeemResponse)
  async updateRedeem(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdateRedeemInput
  ): Promise<RedeemResponse> {
    try {
      const redeem = await this.redeemsService.update(id, input);
      
      logger.info('Redeem update successful', { 
        redeemId: id,
        updates: input 
      });

      return {
        success: true,
        redeem
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update redeem'
        }]
      };
    }
  }

  /**
   * Mutation to remove a redeem (backend only)
   * 
   * @param id - id of the redeem
   * @returns Response indicating success or failure
   * 
   * @example
   * ```graphql
   * mutation { deleteRedeem(
   * id: 1
   * ) { success
   * errors { field message } } }
   * ```
   */
  @Mutation(() => RedeemResponse)
  async deleteRedeem(
    @Arg('id', () => Int) id: number,
  ): Promise<RedeemResponse> {
    try {
      await this.redeemsService.delete(id);

      logger.info('Redeem deletion successful', { 
        redeemId: id
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete redeem'
        }]
      };
    }
  }
} 