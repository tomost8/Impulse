import { Resolver, Mutation, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Community, CommunityResponse } from '../schema/types';
import { CreateCommunityInput, UpdateCommunityInput } from '../schema/inputs';
import { CommunitiesService } from '../../../services/communityService';
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