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





  async findCommentsByPostId(
    postId: number,
    options?: { skip?: number; take?: number }
  ): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      where: {
        post_id: postId,
        parent_comment_id: null, // 仅加载顶层评论
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile_picture: true, // 加载评论用户信息
          },
        },
        replies: {
          take: 5, // 限制每条评论最多加载5条回复
          orderBy: { created_at: 'asc' },
          select: {
            id: true,
            content: true,
            created_at: true,
            user: {
              select: {
                id: true,
                username: true,
                profile_picture: true,
              },
            },
          },
        },
      },
    });
  }  


  /**
   * Delete a comment and its replies
   * 
   * @param commentId - ID of the comment to delete
   * @param userId - ID of the user deleting the comment
   * @returns Promise<{ success: boolean; message?: string }>
   */
  async deleteComment(commentId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      // 检查评论是否存在
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        include: { user: true },
      });
  
      if (!comment) {
        return { success: false, message: 'Comment not found' };
      }
  
      // 检查权限：只有作者或管理员可以删除
      if (comment.user_id !== userId) {
        // 如果有管理员角色，可以在这里添加检查逻辑
        return { success: false, message: 'You do not have permission to delete this comment' };
      }
  
      // 删除评论及其子评论
      await this.prisma.comment.delete({
        where: { id: commentId },
      });
  
      return { success: true };
    } catch (error) {
      console.error(`Failed to delete comment ${commentId}:`, error);
      return { success: false, message: 'An error occurred while deleting the comment' };
    }
  }
  



}


