import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Community, CommunityResponse, CommunitiesResponse } from '../schema/types';
import { CommunitiesService } from '../../../services/communityService';
import { LogOperationMiddleware } from '../../common/middleware/loggerMiddleware';
import logger from '../../../config/logger';

/**
 * GraphQL query resolvers for Community-related operations
 * 
 * @example
 * ```graphql
 * communities {
      id
      name
      description
      influencer {
        id
        name
        email
        createdAt
        updatedAt
      }
      influencerId
      createdAt
      updatedAt
    }
 * ```
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
   * query Communities {
  communities {
    success
    communities {
    }
    errors {
      field
      message
    }
  }
}
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
   * query {
   *   community(id: 1) {
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
      logger.error('Failed to fetch community', {
        communityId: id,
        error: error.message,
        stack: error.stack,
        code: error.code,  // Prisma error code
        meta: error.meta   // Prisma metadata
      });

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