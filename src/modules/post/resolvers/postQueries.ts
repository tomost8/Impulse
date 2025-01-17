import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Post, PostsResponse, PostResponse, PostTargetsProgress } from '../schema/postTypes';
import { PostService } from '../../../services/postService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';

/**
 * GraphQL query resolvers for Post-related operations
 * 
 * This resolver class provides queries for retrieving post information:
 * - List of posts with complex filtering options
 * - Single post lookup
 * - User-specific post lists
 * - Post target processing progress
 * 
 * @remarks
 * All queries return response types that include:
 * - success: boolean indicating operation success
 * - posts/post: the requested post data
 * - errors: array of validation or operation errors
 * 
 * @example
 * ```graphql
 * query {
 *   posts(
 *     targetType: "community"
 *     targetId: 1
 *     unreadOnly: true
 *   ) {
 *     success
 *     posts {
 *       id
 *       caption
 *       mediaUrl
 *       author {
 *         name
 *       }
 *     }
 *   }
 * }
 * ```
 */
@Service()
@Resolver(Post)
@UseMiddleware(LogOperationMiddleware)
export class PostQueries {
  constructor(private postService: PostService) {}

  /**
   * Query to fetch posts with complex filtering options
   * 
   * This query supports multiple filtering criteria:
   * - Target type and ID (e.g., community or group)
   * - Read/unread status for a user
   * - Pagination
   * - Category filtering
   * 
   * @param targetType - Type of target to filter by (e.g., "community", "group")
   * @param targetId - ID of the specific target
   * @param currentUserId - ID of the current user for permission checks
   * @param unreadOnly - Whether to return only unread posts
   * @param skip - Number of records to skip (pagination)
   * @param take - Number of records to take (pagination)
   * @param category - Category to filter posts by
   * @returns PostsResponse containing filtered posts or error details
   * @throws {ValidationError} If filter parameters are invalid
   * 
   * @example
   * ```graphql
   * query {
   *   posts(
   *     targetType: "community"
   *     targetId: 1
   *     currentUserId: 2
   *     unreadOnly: true
   *     skip: 0
   *     take: 10
   *   ) {
   *     success
   *     posts {
   *       id
   *       caption
   *     }
   *   }
   * }
   * ```
   */
  @Query(() => PostsResponse)
  async posts(
    @Arg('targetType', { nullable: true }) targetType?: string,
    @Arg('targetId', () => Int, { nullable: true }) targetId?: number,
    @Arg('currentUserId', () => Int, { nullable: true }) currentUserId?: number,
    @Arg('unreadOnly', () => Boolean, { nullable: true }) unreadOnly?: boolean,
    @Arg('skip', () => Int, { nullable: true }) skip?: number,
    @Arg('take', () => Int, { nullable: true }) take?: number,
    @Arg('category', { nullable: true }) category?: string
  ): Promise<PostsResponse> {
    try {
      const posts = await this.postService.findPosts({ 
        targetType,
        targetId,
        currentUserId,
        unreadOnly,
        skip,
        take,
        category
      });
      return {
        success: true,
        posts
      };
    } catch (error) {
      logger.error('Failed to fetch posts:', error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch posts'
        }]
      };
    }
  }

  /**
   * Query to fetch a single post by ID
   * 
   * This query retrieves detailed information about a specific post,
   * including author information and target associations.
   * 
   * @param id - ID of the post to fetch
   * @returns PostResponse containing the post or error details
   * @throws {NotFoundError} If the post doesn't exist
   * 
   * @example
   * ```graphql
   * query {
   *   post(id: 1) {
   *     success
   *     post {
   *       id
   *       caption
   *       mediaUrl
   *       author {
   *         name
   *       }
   *     }
   *   }
   * }
   * ```
   */
  @Query(() => PostResponse)
  async post(@Arg('id', () => Int) id: number): Promise<PostResponse> {
    try {
      const post = await this.postService.findById(id);
      return {
        success: true,
        post
      };
    } catch (error) {
      logger.error(`Failed to fetch post with id ${id}:`, error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch post'
        }]
      };
    }
  }

  /**
   * Query to fetch all posts by a specific user
   * 
   * This query retrieves posts created by a particular user,
   * with optional pagination support.
   * 
   * @param userId - ID of the user whose posts to fetch
   * @param skip - Number of records to skip (pagination)
   * @param take - Number of records to take (pagination)
   * @returns PostsResponse containing user's posts or error details
   * @throws {ValidationError} If userId is invalid
   * 
   * @example
   * ```graphql
   * query {
   *   postsByUserId(
   *     userId: 1
   *     skip: 0
   *     take: 10
   *   ) {
   *     success
   *     posts {
   *       id
   *       caption
   *       created_at
   *     }
   *   }
   * }
   * ```
   */
  @Query(() => PostsResponse)
  async postsByUserId(
    @Arg('userId', () => Int) userId: number,
    @Arg('skip', () => Int, { nullable: true }) skip?: number,
    @Arg('take', () => Int, { nullable: true }) take?: number
  ): Promise<PostsResponse> {
    try {
      const posts = await this.postService.findByUserId(userId, { skip, take });
      return {
        success: true,
        posts
      };
    } catch (error) {
      logger.error(`Failed to fetch posts for user with id ${userId}:`, error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch posts'
        }]
      };
    }
  }

  /**
   * Query to check the progress of post target processing
   * 
   * This query returns the status of asynchronous target processing
   * for posts with large numbers of targets.
   * 
   * @param postId - ID of the post to check progress for
   * @returns PostTargetsProgress containing processing status and counts
   * @throws {NotFoundError} If the post doesn't exist
   * 
   * @example
   * ```graphql
   * query {
   *   getPostTargetsProgress(postId: 1) {
   *     processed
   *     total
   *     status
   *   }
   * }
   * ```
   */
  @Query(() => PostTargetsProgress)
  async getPostTargetsProgress(
    @Arg('postId', () => Int) postId: number
  ): Promise<PostTargetsProgress> {
    try {
      const progress = await this.postService.getTargetsProgress(postId);
      return progress;
    } catch (error) {
      logger.error(`Failed to fetch post targets progress for post ${postId}:`, error);
      throw error;
    }
  }
} 

