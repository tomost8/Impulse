import { Resolver, Mutation, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Community, CommunityResponse } from '../schema/types';
import { CreateCommunityInput, UpdateCommunityInput } from '../schema/inputs';
import { CommunitiesService } from '../../../services/communityService';
import { CommunityMember, CommunityMemberResponse } from '../schema/types';
import { CreateCommunityMemberInput, UpdateCommunityMemberInput } from '../schema/inputs';
import { CommunityMembersService } from '../../../services/communityService';
import { ValidationError } from '../../../modules/common/errors/graphql.error';
import { LogOperationMiddleware } from '../../common/middleware/loggerMiddleware';
import logger from '../../../config/logger';

/**
 * GraphQL mutation resolvers for community-related operations
 * 
 * @example
 * ```graphql
 * mutation {
 *   createCommunity (input: {
 *     name: "community name"
 *     influencerId: 1
 *     description: "community description (optional)"
 *   }) {
 *     success
 *     community {
 *       id
 *       name
 *       description
 *       influencer {
 *          name
 *       }
 *       influencerId
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
@Resolver(Community)
@UseMiddleware(LogOperationMiddleware)
export class CommunityMutations {
  constructor(private communitiesService: CommunitiesService) {}

  /**
   * Mutation to create a new community
   * 
   * @param input - Community creation data
   * @returns Response containing the newly created community or error details
   * 
   * @example
   * ```graphql
   * mutation {
   *   createCommunity (input: {
   *     name: "community name"
   *     influencerId: 1
   *     description: "community description (optional)"
   *   }) {
   *     success
   *     community {
   *     }
   *     errors {
   *       field
   *       message
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => CommunityResponse)
  async createCommunity(@Arg('input') input: CreateCommunityInput): Promise<CommunityResponse> {
    try {
      const community = await this.communitiesService.create(input);
      
      logger.info('Community creation successful', { 
        communityId: community.id,
      });

      return {
        success: true,
        community
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: error instanceof ValidationError ? 'email' : 'general',
          message: error instanceof Error ? error.message : 'Failed to create community'
        }]
      };
    }
  }

  /**
   * Mutation to update an existing community
   * 
   * @param id - ID of the community to update
   * @param input - Updated community data
   * @returns Response containing the updated community or error details
   * 
   * @example
   * ```graphql
   * mutation {
   *   updateCommunity(
   *     id: 1
   *     input: { 
   *        name: "community name"
   *        description: "community description" 
   *     }
   *   ) {
   *     success
   *     community {
   *     }
   *     errors {
   *       field
   *       message
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => CommunityResponse)
  async updateCommunity(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdateCommunityInput
  ): Promise<CommunityResponse> {
    try {
      const community = await this.communitiesService.update(id, input);
      
      logger.info('Community update successful', { 
        communityId: community.id,
        updates: input 
      });

      return {
        success: true,
        community
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update community'
        }]
      };
    }
  }

  /**
   * Mutation to delete a community
   * @param id - ID of the community to delete
   * @returns Response indicating success or failure
   * 
   * @example
   * ```graphql
   * mutation {
   *   deleteCommunity(id: 1) {
   *     success
   *     errors {
   *       field
   *       message
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => CommunityResponse)
  async deleteCommunity(@Arg('id', () => Int) id: number): Promise<CommunityResponse> {
    try {
      await this.communitiesService.delete(id);
      
      logger.info('Community deletion successful', { communityId: id });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete community'
        }]
      };
    }
  }
} 


/**
 * GraphQL mutation resolvers for member-related operations
 * 
 * @example
 * ```graphql
 * example
 * ```
 */
@Service()
@Resolver(CommunityMember)
@UseMiddleware(LogOperationMiddleware)
export class CommunityMemberMutations {
  constructor(private communityMembersService: CommunityMembersService) {}

  /**
   * Mutation to add a member to a community
   * 
   * @param input - Community/User creation data
   * @returns Response containing the newly created Community/User relation or error details
   * 
   * @example
   * ```graphql
   * example
   * ```
   */
  @Mutation(() => CommunityMemberResponse)
  async createCommunityMember(@Arg('input') input: CreateCommunityMemberInput): Promise<CommunityMemberResponse> {
    try {
      const community_member = await this.communityMembersService.create(input);
      
      logger.info('Community request creation successful', { 
        communityId: community_member.community_id,
        userId: community_member.user_id,
      });

      return {
        success: true,
        community_member
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: error instanceof ValidationError ? 'email' : 'general',
          message: error instanceof Error ? error.message : 'Failed to create community'
        }]
      };
    }
  }

  /**
   * Mutation to update an existing community
   * 
   * @param id - ID of the community to update
   * @param input - Updated community data
   * @returns Response containing the updated community or error details
   * 
   * @example
   * ```graphql
   * example
   * ```
   */
  @Mutation(() => CommunityMemberResponse)
  async updateCommunityMember(
    @Arg('community_id', () => Int) community_id: number,
    @Arg('user_id', () => Int) user_id: number,
    @Arg('input') input: UpdateCommunityMemberInput
  ): Promise<CommunityMemberResponse> {
    try {
      const community_member = await this.communityMembersService.update(community_id, user_id, input);
      
      logger.info('Community Member update successful', { 
        communityId: community_member.community_id,
        userId: community_member.user_id,
        updates: input 
      });

      return {
        success: true,
        community_member
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update community'
        }]
      };
    }
  }

  /**
   * Mutation to delete a community
   * @param id - ID of the community to delete
   * @returns Response indicating success or failure
   * 
   * @example
   * ```graphql
   * mutation {
   *   deleteCommunityMember(community_id: 1, user_id: 1) {
   *     success
   *     errors {
   *       field
   *       message
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => CommunityMemberResponse)
  async deleteCommunityMember(
    @Arg('community_id', () => Int) community_id: number,
    @Arg('user_id', () => Int) user_id: number,
  ): Promise<CommunityMemberResponse> {
    try {
      await this.communityMembersService.delete(community_id, user_id);
      
      logger.info('User successfully removed/rejected from community', { 
        communityId: community_id,
        userId: user_id
    });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete community'
        }]
      };
    }
  }
} 