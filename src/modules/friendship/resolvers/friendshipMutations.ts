import { Resolver, Mutation, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Friendship, FriendshipResponse } from '../schema/friendshipTypes';
import { CreateFriendshipInput, UpdateFriendshipInput } from '../schema/friendshipInputs';
import { FriendshipsService } from '../../../services/friendshipService';
import { ValidationError } from '../../common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';


/**
 * GraphQL mutation resolvers for friends + friend request operations
 */
@Service()
@Resolver(Friendship)
@UseMiddleware(LogOperationMiddleware)
export class FriendshipMutations {
  constructor(private friendshipsService: FriendshipsService) {}

  /**
   * Mutation to add a friendship
   * e.g. send a friend request
   * @param input - friend request creation data
   * @returns Response containing the newly created friendshiprelation or error details
   * 
   * @example
   * ```graphql
   * mutation { createFriendship(
   * input: { sender_id: 3, receiver_id: 31 }
   * ) { success friendship { 
   * 
   * } errors { field message } } }
   * ```
   */
  @Mutation(() => FriendshipResponse)
  async createFriendship(@Arg('input') input: CreateFriendshipInput): Promise<FriendshipResponse> {
    try {
      const friendship = await this.friendshipsService.create(input);
      return {
        success: true,
        friendship
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create friend request'
        }]
      };
    }
  }

  /**
   * Mutation to update a friendship
   * e.g. accept/reject a friend request
   * 
   * @param user_id - ID of the user (that is accepting/rejecting request)
   * @param friend_id - ID of the friend (that sent the request)
   * @param input - Updated friendship status data
   * @returns Response containing the updated friendship or error details
   * 
   * @example
   * ```graphql
   * mutation { updateFriendship(
   * user_id: 3, friend_id: 41, input: { status: "accepted" }
   * ) { success friendship { 
   * 
   * } errors { field message } } }
   * ```
   */
  @Mutation(() => FriendshipResponse)
  async updateFriendship(
    @Arg('user_id', () => Int) user_id: number,
    @Arg('friend_id', () => Int) friend_id: number,
    @Arg('input') input: UpdateFriendshipInput
  ): Promise<FriendshipResponse> {
    try {
      const friendship = await this.friendshipsService.update(user_id, friend_id, input);
      return {
        success: true,
        friendship
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update friendship relation'
        }]
      };
    }
  }

  /**
   * Mutation to remove a friendship
   * i.e. remove a friend
   * @param user_id - ID of the user
   * @param friend_id - ID of the friend to remove
   * @returns Response indicating success or failure
   * 
   * @example
   * ```graphql
   * mutation { deleteFriendship(
   * user_id: 1, friend_id: 1
   * ) { success
   * errors { field message } } }
   * ```
   */
  @Mutation(() => FriendshipResponse)
  async deleteFriendship(
    @Arg('user_id', () => Int) user_id: number,
    @Arg('friend_id', () => Int) friend_id: number,
  ): Promise<FriendshipResponse> {
    try {
      await this.friendshipsService.delete(user_id, friend_id);

      logger.info('Friendship relation deletion successful', { 
        userId: user_id,
        friendId: friend_id
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete friendship'
        }]
      };
    }
  }
} 