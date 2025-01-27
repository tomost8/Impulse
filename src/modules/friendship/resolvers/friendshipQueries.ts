import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Friendship, FriendshipResponse, FriendshipsResponse } from '../schema/friendshipTypes';
import { FriendshipsService } from '../../../services/friendshipService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';
import { UserSortType } from '../../common/types/enumTypes';


/**
 * GraphQL query resolvers for friendship-related operations
 */
@Service()
@Resolver(Friendship)
@UseMiddleware(LogOperationMiddleware)
export class FriendshipQueries {
  constructor(private friendshipsService: FriendshipsService) {}

  /**
   * Query to fetch all friends for a user
   * 
   * @param id - The ID of the user
   * @returns Response containing array of all friendships
   * 
   * @example
   * ```graphql
   * query { getFriendships(
   * id: 1
   * ) { success friendships { 
   * 
   * } errors { field message } } }
   * 
   * ```
   */
  @Query(() => FriendshipsResponse)
  async getFriendships(
    @Arg('id', () => Int) id: number,
    @Arg('sort_by', () => UserSortType, {nullable: true}) sort_by?: UserSortType
  ): Promise<FriendshipsResponse> {
    try {
      const friendships = await this.friendshipsService.getFriends(id, sort_by);
      if (!friendships) {
        logger.warn('Friendships not found', { userId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `friendships for user ID ${id} not found`
          }]
        }
      }
      return {
        success: true,
        friendships
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch friendships'
        }]
      };
    }
  }

  /**
   * Query to fetch all friend requests for a user
   * 
   * @param id - The ID of the user
   * @returns Response containing array of all friend requests for a user
   * 
   * @example
   * ```graphql
   * query { getFriendRequests(
   * id: 1
   * ) { success friendships { 
   * 
   * } errors { field message } } }
   * ```
   */
  @Query(() => FriendshipsResponse)
  async getFriendRequests(
    @Arg('id', () => Int) id: number,
    @Arg('role', () => String) role: string,
  ): Promise<FriendshipsResponse> {
    try {
      const friendships = await this.friendshipsService.getFriendRequests(id, role);
      if (!friendships) {
        logger.warn('friend requests not found', { communityId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `friend requests for user ID ${id} not found`
          }]
        }
      }
      return {
        success: true,
        friendships
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch friendship requests'
        }]
      };
    }
  }
}