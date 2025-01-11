import { Resolver, Mutation, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Post, PostResponse } from '../schema/postTypes';
import { CreatePostInput, UpdatePostInput } from '../schema/postInputs';
import { PostService } from '../../../services/postService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';

@Service()
@Resolver(Post)
@UseMiddleware(LogOperationMiddleware)
export class PostMutations {
  constructor(private postService: PostService) {}

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
}
