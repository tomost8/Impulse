import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Community, CommunityResponse, CommunitiesResponse } from '../schema/communityTypes';
import { CommunitiesService } from '../../../services/communityService';
import { CommunityMember, CommunityMemberResponse, CommunityMembersResponse } from '../schema/communityTypes';
import { CommunityMembersService } from '../../../services/communityService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';

/**
 * GraphQL query resolvers for Community-related operations
 */
@Service()
@Resolver(Community)
@UseMiddleware(LogOperationMiddleware)
export class CommunityQueries {
  constructor(private communitiesService: CommunitiesService) {}

  /**
   * Query to fetch all communities
   * 
   * @returns Response containing array of all communities in the system
   * 
   * @example
   * ```graphql
   * query { communities { 
   *    success 
   *    communities { 
   *        id 
   *        name 
   *        description 
   *        thumbnail 
   *        influencer { 
   *            id 
   *            first_name 
   *            last_name 
   *            email 
   *        } 
   *        influencer_id 
   *        created_at 
   *        updated_at 
   *    } 
   *    errors { 
   *        field 
   *        message 
   *    } 
   * }}
   * ```
   */
  @Query(() => CommunitiesResponse)
  async communities(): Promise<CommunitiesResponse> {
    try {
      const communities = await this.communitiesService.findAll();
      return {
        success: true,
        communities
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch communities'
        }]
      };
    }
  }

  /**
   * Query to fetch a single community by ID
   * 
   * @param id - The ID of the community to fetch
   * @returns Response containing the community if found
   * 
   * @example
   * ```graphql
   * query { community(id: 1) {
   *    success 
   *    communities { 
   *        id 
   *        name 
   *        description 
   *        thumbnail 
   *        influencer { 
   *            id 
   *            first_name 
   *            last_name 
   *            email 
   *        } 
   *        influencer_id 
   *        created_at 
   *        updated_at 
   *    } 
   *    errors { 
   *        field 
   *        message 
   *    }
   * }}
   * ```
   */
  @Query(() => CommunityResponse)
  async community(@Arg('id', () => Int) id: number): Promise<CommunityResponse> {
    try {
      const community = await this.communitiesService.findById(id);
      if (!community) {
        logger.warn('Community not found', { communityId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `Community with ID ${id} not found`
          }]
        };
      }

      logger.info('Successfully fetched community', { 
        communityId: community.id,
        name: community.name
      });

      return { success: true, community };
    } catch (error: any) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch community'
        }]
      };
    }
  }
} 




/**
 * GraphQL query resolvers for Community/Member-related operations
 */
@Service()
@Resolver(CommunityMember)
@UseMiddleware(LogOperationMiddleware)
export class CommunityMemberQueries {
  constructor(private communityMembersService: CommunityMembersService) {}

  /**
   * Query to fetch all members of a community given community id
   * 
   * @returns Response containing array of all members of a community
   * 
   * @example
   * ```graphql
   * query { communityMembers(id: 1) {
   *    success 
   *    community_members { 
   *        user { 
   *            first_name 
   *            last_name 
   *        } 
   *        user_id 
   *        role 
   *        status 
   *    }
   *    errors { 
   *        field 
   *        message 
   *    } 
   * }}
   * 
   * ```
   */
  @Query(() => CommunityMembersResponse)
  async communityMembers(@Arg('id', () => Int) id: number): Promise<CommunityMembersResponse> {
    try {
      const community_members = await this.communityMembersService.findById(id);
      if (!community_members) {
        logger.warn('Community not found', { communityId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `Community with ID ${id} not found`
          }]
        }
      }
      return {
        success: true,
        community_members
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch communities'
        }]
      };
    }
  }
}