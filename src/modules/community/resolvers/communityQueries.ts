import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Community, CommunityResponse, CommunitiesResponse } from '../schema/communityTypes';
import { CommunitiesService } from '../../../services/communityService';
import { CommunityMember, CommunityMemberResponse, CommunityMembersResponse } from '../schema/communityTypes';
import { CommunityMembersService } from '../../../services/communityService';
import { Category } from '../../common/types/enumTypes';
import { CommunityCategory, CommunityCategoryResponse, CommunityCategoriesResponse } from '../schema/communityTypes';
import { CommunityCategoriesService } from '../../../services/communityService';
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
   * Query to fetch all communities in database
   * 
   * @returns Response containing array of all communities in the system
   * 
   * @example
   * ```graphql
   * query { getAllCommunities 
   * { success communities { 
   * id name description thumbnail influencer { id first_name last_name email } created_at updated_at
   * } errors { field message } } }
   * ```
   */
  @Query(() => CommunitiesResponse)
  async getAllCommunities(): Promise<CommunitiesResponse> {
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
   * query { getCommunity(
   * id: 1
   * ) { success community { 
   * id name description thumbnail influencer { id first_name last_name email } created_at updated_at
   * } errors { field message } } }
   * ```
   */
  @Query(() => CommunityResponse)
  async getCommunity(@Arg('id', () => Int) id: number): Promise<CommunityResponse> {
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
   * Query to fetch all members for a community
   * 
   * @param id - The ID of the community
   * @returns Response containing array of all members of a community
   * 
   * @example
   * ```graphql
   * query { getCommunityMembers(
   * id: 1
   * ) { success community_members { 
   * user { id first_name last_name } role status
   * } errors { field message } } }
   * 
   * ```
   */
  @Query(() => CommunityMembersResponse)
  async getCommunityMembers(@Arg('id', () => Int) id: number): Promise<CommunityMembersResponse> {
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

  /**
   * Query to fetch all communities for a user
   * 
   * @param id - The ID of the user
   * @returns Response containing array of all communities a user is in
   * 
   * @example
   * ```graphql
   * query { getUserCommunities(
   * id: 1
   * ) { success community_members { 
   * community { id name } role status
   * } errors { field message } } }
   * ```
   */
  @Query(() => CommunityMembersResponse)
  async getUserCommunities(@Arg('id', () => Int) id: number): Promise<CommunityMembersResponse> {
    try {
      const community_members = await this.communityMembersService.findByUserId(id);
      if (!community_members) {
        logger.warn('Community not found', { communityId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `Community for user with user ID ${id} not found`
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


/**
 * GraphQL query resolvers for Community/Member-related operations
 */
@Service()
@Resolver(CommunityCategory)
@UseMiddleware(LogOperationMiddleware)
export class CommunityCategoryQueries {
  constructor(private communityCategoriesService: CommunityCategoriesService) {}

  /**
   * Query to fetch all categories for a community
   * 
   * @param id - The ID of the community
   * @returns Response containing array of all categorie of a community
   * 
   * @example
   * ```graphql
   * query { getCommunityCategories(
   * id: 1
   * ) { success community_categories { 
   * category
   * } errors { field message } } }
   * 
   * ```
   */
  @Query(() => CommunityCategoriesResponse)
  async getCommunityCategories(@Arg('id', () => Int) id: number): Promise<CommunityCategoriesResponse> {
    try {
      const community_categories = await this.communityCategoriesService.findById(id);
      if (!community_categories) {
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
        community_categories
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
   * Query to fetch all communities for a category
   * 
   * @param category - the category
   * @returns Response containing array of all communities of the category
   * 
   * @example
   * ```graphql
   * query { getCategoryCommunities(
   * id: 1
   * ) { success community_categories { 
   * community { id name }
   * } errors { field message } } }
   * ```
   */
  @Query(() => CommunityCategoriesResponse)
  async getCategoryCommunities(
    @Arg('category', () => Category) category: Category
  ): Promise<CommunityCategoriesResponse> {
    try {
      const community_categories = await this.communityCategoriesService.findByCategoryId(category);
      if (!community_categories) {
        logger.warn('Community not found', { category: category });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `Community for category ${category} not found`
          }]
        }
      }
      return {
        success: true,
        community_categories
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