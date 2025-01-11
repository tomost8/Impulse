import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Post, PostsResponse, PostResponse, PostTargetsProgress } from '../schema/postTypes';
import { PostService } from '../../../services/postService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';

@Service()
@Resolver(Post)
@UseMiddleware(LogOperationMiddleware)
export class PostQueries {
  constructor(private postService: PostService) {}

  @Query(() => PostsResponse)
  async posts(
    @Arg('skip', () => Int, { nullable: true }) skip?: number,
    @Arg('take', () => Int, { nullable: true }) take?: number,
    @Arg('category', { nullable: true }) category?: string
  ): Promise<PostsResponse> {
    try {
      const posts = await this.postService.findAll({
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