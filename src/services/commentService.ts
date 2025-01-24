import { Service } from 'typedi';
import { PrismaClient, Prisma, Comment } from '@prisma/client';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import logger from '../config/logger';
import { CreateCommentInput } from '../modules/comment/ scheme/commentInputs';

/**
 * Service handling comment-related business logic and database operations
 * 
 * This service provides methods for managing comments in the system, including:
 * - CRUD operations for comment management
 * - Handling of comment relationships (post, user, parent comments)
 * - Validation and error handling
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class CommentService {
  constructor(
    private prisma: PrismaClient
  ) {}

  /**
   * Create a new comment with proper relationship handling
   * 
   * @param data - Comment creation data containing required information
   * @returns Promise<Comment> The newly created comment with all relationships
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If referenced post, user or parent comment not found
   */
  async create(data: CreateCommentInput & { user_id: number }): Promise<Comment> {
    try {
      // Verify post exists
      const post = await this.prisma.post.findUnique({
        where: { id: data.post_id }
      });

      if (!post) {
        throw new NotFoundError(`Post with id ${data.post_id} not found`);
      }

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: data.user_id }
      });

      if (!user) {
        throw new NotFoundError(`User with id ${data.user_id} not found`);
      }

      // If parent_comment_id is provided, verify parent comment exists
      if (data.parent_comment_id) {
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: data.parent_comment_id }
        });

        if (!parentComment) {
          throw new NotFoundError(
            `Parent comment with id ${data.parent_comment_id} not found`
          );
        }

        // Verify parent comment belongs to the same post
        if (parentComment.post_id !== data.post_id) {
          throw new ValidationError(
            'Parent comment must belong to the same post'
          );
        }
      }

      // Create the comment with all relationships
      return await this.prisma.comment.create({
        data: {
          content: data.content,
          post: { connect: { id: data.post_id } },
          user: { connect: { id: data.user_id } },
          ...(data.parent_comment_id && {
            parent_comment: { connect: { id: data.parent_comment_id } },
          }),
        },
        // 不加载关联数据
        select: {
          id: true,
          content: true,
          post_id: true,
          user_id: true,
          parent_comment_id: true,
          created_at: true,
          updated_at: true,
        },
      });

    } catch (error) {
      // Log the error for debugging
      logger.error('Failed to create comment:', { error, data });
      
      // Handle specific error types
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;  // Pass through our custom errors
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ValidationError('Comment already exists');
        }
        if (error.code === 'P2003') {
          throw new ValidationError('Invalid reference ID provided');
        }
      }
      
      // Convert other errors to validation error
      throw new ValidationError(
        'Failed to create comment. Please try again.',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
}