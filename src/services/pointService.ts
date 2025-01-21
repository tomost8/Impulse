import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Point, Reward, Redeem } from '../modules/point/schema/pointTypes';
import { UpdatePointInput } from '../modules/point';
import { CreateRewardInput, UpdateRewardInput } from '../modules/point';
import { CreateRedeemInput, UpdateRedeemInput } from '../modules/point';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';


/**
 * Service handling point-related business logic
 * 
 * This service provides methods for managing user points in the system,
 * including CRUD operations and point-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class PointsService {
  constructor(private prisma: PrismaClient) {}
  /**
   * Get point info of a user by id
   * 
   * @param id - The unique identifier of the user
   * @returns Promise resolving to the user point info if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async getPoint(id: number): Promise<Point | null> {
    return await this.prisma.point.findUnique({
      where: {
        user_id: id
      },
      include: {
        user: true
      }
    });
  }

  /**
   * Update a user's points
   * 
   * @param id - id of user
   * @param input - Updated user points
   * @returns Promise resolving to the updated reward
   * @throws {NotFoundError} If community doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(id: number, input: UpdatePointInput): Promise<Point> {
    try {
      return await this.prisma.point.update({
        where: { 
          user_id: id
        },
        data: {
          points: { increment: input.points_added },
          spending_points: { increment: input.points_added },
          weekly_points: { increment: input.points_added },
          monthly_points: { increment: input.points_added }
        },
        include: {
          user: true
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`User ${id} not found`);
      }
      throw error;
    }
  }
} 




/**
 * Service handling reward-related business logic
 * 
 * This service provides methods for managing reward relations in the system,
 * including CRUD operations and reward-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class RewardsService {
  constructor(private prisma: PrismaClient) {}
  /**
   * Get all rewards
   * 
   * @returns Promise resolving to the rewards if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async getRewards(): Promise<Reward[] | null> {
    return await this.prisma.reward.findMany({});
  }

  /**
   * Create reward (backend only)
   * 
   * @param input - Reward creation data
   * @returns Promise resolving to the created friend request
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateRewardInput): Promise<Reward> {
    try {
      return await this.prisma.reward.create({
        data: input
      });
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update reward details (backend only)
   * 
   * @param id - id of reward
   * @param input - Updated reward details
   * @returns Promise resolving to the updated reward
   * @throws {NotFoundError} If reward doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(id: number, input: UpdateRewardInput): Promise<Reward> {
    try {
      const input_no_null: Record<string, any> = {};
      if (input.title !== null) {
        input_no_null.title = input.title;
      }
      if (input.description !== null) {
        input_no_null.description = input.description;
      }
      if (input.required_points !== null) {
        input_no_null.required_points = input.required_points;
      }
      return await this.prisma.reward.update({
        where: { 
          id: id
        },
        data: input_no_null
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Reward ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Remove a reward (backend only)
   * 
   * @param id - reward id
   * @throws {NotFoundError} If reward doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(id: number): Promise<void> {
    try {
      await this.prisma.reward.delete({
        where: { 
          id: id
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Reward ${id} not found`);
      }
      throw error;
    }
  }
} 




/**
 * Service handling redeem-related business logic
 * 
 * This service provides methods for managing redeems in the system,
 * including CRUD operations and redeem-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class RedeemsService {
  constructor(private prisma: PrismaClient) {}
  /**
   * Get all redeems for a user
   * 
   * @param id - ID of the user
   * @returns Promise resolving to the redeems if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async getRedeems(id: number): Promise<Redeem[] | null> {
    return await this.prisma.redeem.findMany({
      where: {
        user_id: id
      },
      include: {
        user: true,
        reward: true
      }
    });
  }

  /**
   * Create redeem
   * 
   * @param input - Redeem creation data
   * @returns Promise resolving to the created redeem
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateRedeemInput): Promise<Redeem> {
    try {
      let reward_redeemed = await this.prisma.reward.findUnique({
        where: {
          id: input.reward_id
        }
      });
      if (!reward_redeemed) {
        throw new NotFoundError('reward not found');
      };
      //check if user has enough points
      const user_redeeming = await this.prisma.point.update({
        where: {
          user_id: input.user_id,
          spending_points: {
            gte: reward_redeemed.required_points
          }
        },
        data: {
          spending_points: {
            decrement: reward_redeemed.required_points
          }
        }
      });
      return await this.prisma.redeem.create({
        data: {
          user_id: input.user_id,
          reward_id: input.reward_id,
          points_spent: reward_redeemed.required_points
        },
        include: {
          user: true,
          reward: true
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`User ${input.user_id} either not found or does not have enough points to redeem reward ${input.reward_id}`);
      }
      throw error;
    }
  }

  /**
   * Update redeem status (backend only)
   * 
   * @param id - id of redeem
   * @param input - Updated redeem status
   * @returns Promise resolving to the updated redeem
   * @throws {NotFoundError} If redeem doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(id: number, input: UpdateRedeemInput): Promise<Redeem> {
    try {
      const input_no_null: Record<string, any> = {};
      if (input.status !== null) {
        input_no_null.status = input.status;
      }
      if (input.processing_time !== null) {
        input_no_null.processing_time = input.processing_time;
      }
      return await this.prisma.redeem.update({
        where: { 
          id: id
        },
        data: input_no_null,
        include: {
          user: true,
          reward: true
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Redeem ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete a redeem (backend only)
   * 
   * @param id - redeem id
   * @throws {NotFoundError} If redeem doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(id: number): Promise<void> {
    try {
      await this.prisma.redeem.delete({
        where: { 
          id: id
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Redeem ${id} not found`);
      }
      throw error;
    }
  }
} 

