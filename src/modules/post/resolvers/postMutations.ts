import { Resolver, Mutation, Arg, Int, UseMiddleware, Ctx } from 'type-graphql';
import { Service } from 'typedi';
import { Post, PostResponse, BaseResponse } from '../schema/postTypes';
import { CreatePostInput, UpdatePostInput } from '../schema/postInputs';
import { PostService } from '../../../services/postService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { UsersService } from '../../../services/userService';
import { LikeService } from '../../../services/likeService';

/**
 * GraphQL mutation resolvers for Post-related operations
 * 
 * This resolver class handles all post mutations including:
 * - Post creation and updates
 * - Post deletion
 * - View tracking
 * 
 * @remarks
 * All mutations return either PostResponse or BaseResponse types that include:
 * - success: boolean indicating operation success
 * - post: the affected post (if applicable)
 * - errors: array of validation or operation errors
 * 
 * @example
 * ```graphql
 * mutation {
 *   createPost(input: {
 *     caption: "Hello World"
 *     mediaUrl: "https://example.com/image.jpg"
 *   }) {
 *     success
 *     post {
 *       id
 *       caption
 *       mediaUrl
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
@Resolver(Post)
@UseMiddleware(LogOperationMiddleware)
export class PostMutations {
  constructor(private postService: PostService, private usersService: UsersService, private likeService: LikeService) {}

  /**
   * Mutation to record a view of a post by a user
   * 
   * This mutation tracks when a user views a post, which can be used for
   * analytics and to mark posts as read/unread.
   * 
   * @param postId - ID of the post that was viewed
   * @param userId - ID of the user who viewed the post
   * @returns BaseResponse indicating success or failure
   * @throws {NotFoundError} If the post or user doesn't exist
   * 
   * @example
   * ```graphql
   * mutation {
   *   viewPost(postId: 1, userId: 2) {
   *     success
   *     errors {
   *       field
   *       message
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => BaseResponse)
  async viewPost(
    @Arg('postId', () => Int) postId: number,
    @Arg('userId', () => Int) userId: number
  ): Promise<BaseResponse> {
    try {
      await this.postService.recordView(postId, userId);
      return {
        success: true
      };
    } catch (error) {
      logger.error(`Failed to record view for post ${postId} by user ${userId}:`, error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to record post view'
        }]
      };
    }
  }

  /**
   * Mutation to create a new post
   * 
   * This mutation creates a new post with the provided data and handles:
   * - Post metadata creation
   * - Target audience assignment
   * - Activity status updates
   * 
   * @param input - Post creation data containing required information
   * @returns PostResponse with the newly created post or error details
   * @throws {ValidationError} If validation fails or prerequisites are not met
   * 
   * @example
   * ```graphql
   * mutation {
   *   createPost(input: {
   *     caption: "New Post"
   *     mediaUrl: "https://example.com/image.jpg"
   *     authorId: 1
   *     post_targets: [
   *       { target_type: "community", target_id: 1 }
   *     ]
   *   }) {
   *     success
   *     post {
   *       id
   *       caption
   *       mediaUrl
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => PostResponse)
  async createPost(
    @Arg('input') input: CreatePostInput
  ): Promise<PostResponse> {
    try {
      const post = await this.postService.create(input);
      return {
        success: true,
        post
      };
    } catch (error) {
      logger.error('Failed to create post:', error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create post'
        }]
      };
    }
  }

  /**
   * Mutation to update an existing post
   * 
   * This mutation updates a post's information while maintaining:
   * - Data integrity
   * - Target audience associations
   * - Activity relationships
   * 
   * @param id - ID of the post to update
   * @param input - Updated post data containing fields to modify
   * @returns PostResponse with the updated post or error details
   * @throws {NotFoundError} If the post doesn't exist
   * @throws {ValidationError} If validation fails
   * 
   * @example
   * ```graphql
   * mutation {
   *   updatePost(
   *     id: 1,
   *     input: {
   *       caption: "Updated Caption"
   *     }
   *   ) {
   *     success
   *     post {
   *       id
   *       caption
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => PostResponse)
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdatePostInput
  ): Promise<PostResponse> {
    try {
      const post = await this.postService.update(id, input);
      return {
        success: true,
        post
      };
    } catch (error) {
      logger.error(`Failed to update post with id ${id}:`, error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update post'
        }]
      };
    }
  }

  /**
   * Mutation to delete a post from the system
   * 
   * This mutation permanently removes a post and:
   * - Deletes associated targets
   * - Removes view records
   * - Updates related activity statuses
   * 
   * @param id - ID of the post to delete
   * @returns PostResponse with the deleted post or error details
   * @throws {NotFoundError} If the post doesn't exist
   * @remarks This operation cannot be undone
   * 
   * @example
   * ```graphql
   * mutation {
   *   deletePost(id: 1) {
   *     success
   *     post {
   *       id
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => PostResponse)
  async deletePost(@Arg('id', () => Int) id: number): Promise<PostResponse> {
    try {
      const post = await this.postService.delete(id);
      return {
        success: true,
        post
      };
    } catch (error) {
      logger.error(`Failed to delete post with id ${id}:`, error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete post'
        }]
      };
    }
  }



@Mutation(() => BaseResponse)
@UseMiddleware(authMiddleware)
async likePost(
  @Arg('postId', () => Int) postId: number,
  @Ctx() context: any
): Promise<BaseResponse> {
  try {
    const { uid } = context.user;

    const user = await this.usersService.findByFirebaseUid(uid);


    if (!user || !user.id) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: 'User not found'
        }]
      };
    }

    const result = await this.likeService.likePost(postId, user.id);

    return {
      success: result.success
    };
  } catch (error) {
    console.error('Failed to like post:', error);
    return {
      success: false,
      errors: [{
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to like post'
      }]
    };
  }
}


@Mutation(() => BaseResponse)
@UseMiddleware(authMiddleware)
async unlikePost(
  @Arg('postId', () => Int) postId: number,
  @Ctx() context: any
): Promise<BaseResponse> {
  try {
    const { uid } = context.user;

    const user = await this.usersService.findByFirebaseUid(uid);


    if (!user || !user.id) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: 'User not found'
        }]
      };
    }

    const result = await this.likeService.unlikePost(postId, user.id);

    return {
      success: result.success
    };
  } catch (error) {
    console.error('Failed to unlike post:', error);
    return {
      success: false,
      errors: [{
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to unlike post'
      }]
    };
  }
}



}
