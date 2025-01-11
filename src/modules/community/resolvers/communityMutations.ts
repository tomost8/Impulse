import { Resolver, Mutation, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Community, CommunityResponse,CommunityMember, CommunityMemberResponse } from '../schema/communityTypes';
import { CreateCommunityInput, UpdateCommunityInput } from '../schema/communityInputs';
import { CommunitiesService } from '../../../services/communityService';
import { CreateCommunityMemberInput, UpdateCommunityMemberInput } from '../schema/communityInputs';
import { CommunityMembersService } from '../../../services/communityService';
import { ValidationError } from '../../common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';

/**
 * GraphQL mutation resolvers for community-related operations
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
   * mutation { createCommunity (
   *    input: {
   *        name: "community name",
   *        influencerId: 1,
   *        description: "community description (optional)",
   *        thumbnail: "community thumbnail (optional)"
   *    }) {
   *        success 
   *        community { 
   *            id 
   *            name 
   *            description 
   *            thumbnail 
   *            influencer { 
   *                first_name 
   *                last_name 
   *                email 
   *            } 
   *            influencer_id 
   *        } 
   *        errors { 
   *            field 
   *            message 
   *        }
   *    }
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
          field: 'general',
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
   *    updateCommunity (
   *        id: 1,
   *        input: {
   *            name: "updated name",
   *            description: "updated description",
   *            thumbnail: "updated thumbnail"
   *        }
   *    ) {
   *        success 
   *        community { 
   *            id 
   *            name 
   *            description 
   *            thumbnail 
   *            influencer { 
   *                first_name 
   *                last_name 
   *                email 
   *            } 
   *            influencer_id 
   *        } 
   *        errors { 
   *            field 
   *            message 
   *        }
   *    }
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
        communityId: id,
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
   * mutation { deleteCommunity(id: 1) {
   *    success
   *    errors {
   *        field
   *        message
   *    }
   * }}
   * ```
   */
  @Mutation(() => CommunityResponse)
  async deleteCommunity(@Arg('id', () => Int) id: number): Promise<CommunityResponse> {
    try {
      await this.communitiesService.delete(id);
      logger.info('Community deletion successful', { 
        communityId: id 
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


/**
 * GraphQL mutation resolvers for member-related operations
 */
@Service()
@Resolver(CommunityMember)
@UseMiddleware(LogOperationMiddleware)
export class CommunityMemberMutations {
  constructor(private communityMembersService: CommunityMembersService) {}

  /**
   * Mutation to add a Community/User relation
   * e.g. add a User to a Community
   * @param input - Community/User creation data
   * @returns Response containing the newly created Community/User relation or error details
   * 
   * @example
   * ```graphql
   * mutation { 
   *    createCommunity(
   *        input: {
   *            community_id: 3,
   *            user_id: 31
   *        }
   *    ) { 
   *        success 
   *        community_member { 
   *            community { 
   *                name 
   *                influencer { 
   *                    first_name 
   *                    last_name 
   *                } 
   *                influencer_id 
   *            } 
   *            community_id 
   *            user { 
   *                first_name 
   *                last_name 
   *            } 
   *            user_id 
   *            role 
   *            status 
   *        }
   *        errors { 
   *            field 
   *            message 
   *        }
   *    } 
   * }
   * ```
   */
  @Mutation(() => CommunityMemberResponse)
  async createCommunityMember(@Arg('input') input: CreateCommunityMemberInput): Promise<CommunityMemberResponse> {
    try {
      const community_member = await this.communityMembersService.create(input);
      
      logger.info('Community/User relation creation successful', { 
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
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create community/user relation'
        }]
      };
    }
  }

  /**
   * Mutation to update the role/status of a User in a Community
   * 
   * @param community_id - ID of the community to update from
   * @param user_id - ID of the user to update
   * @param input - Updated user role/status data
   * @returns Response containing the updated community/user relation or error details
   * 
   * @example
   * ```graphql
   * mutation { 
   *    updateCommunityMember(
   *        community_id: 3,
   *        user_id: 41, 
   *        input: {
   *            role: "member",
   *            status: "approved"
   *        }
   *    ) { 
   *        success 
   *        community_member { 
   *            community { 
   *                name 
   *                influencer { 
   *                    first_name 
   *                    last_name 
   *                } 
   *                influencer_id 
   *            } 
   *            community_id 
   *            user { 
   *                first_name 
   *                last_name 
   *            } 
   *            user_id 
   *            role 
   *            status 
   *        }
   *        errors { 
   *            field 
   *            message 
   *        }
   *    } 
   * }
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
      
      logger.info('Community/User relation update successful', { 
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
          message: error instanceof Error ? error.message : 'Failed to update community/user relation'
        }]
      };
    }
  }

  /**
   * Mutation to remove a Community/User Relation
   * i.e. remove a Member from a Community
   * @param community_id - ID of the community to delete from
   * @param user_id - ID of the user to delete
   * @returns Response indicating success or failure
   * 
   * @example
   * ```graphql
   * mutation {
   *    deleteCommunityMember(community_id: 1, user_id: 1) {
   *        success
   *        errors {
   *            field
   *            message
   *        }
   *    }
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

      logger.info('Community/User relation deletion successful', { 
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
          message: error instanceof Error ? error.message : 'Failed to delete community/user relation'
        }]
      };
    }
  }
} 