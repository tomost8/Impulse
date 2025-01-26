import { Resolver, Mutation, Arg, Ctx, UseMiddleware, Int } from 'type-graphql';
import { Service } from 'typedi';

import { CommentService } from '../../../services/commentService';
import { ValidationError } from '../../common/errors/graphql.error';
import { Comment, CommentResponse } from '../ scheme/commentTypes';
import { CreateCommentInput } from '../ scheme/commentInputs';
import { UsersService } from '../../../services/userService';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import { BaseResponse } from '../../post/schema/postTypes';


@Service()
@Resolver(Comment)
export class CommentMutations {
  constructor(
    private commentService: CommentService,
    private usersService: UsersService
  ) {}

  @Mutation(() => CommentResponse)
  @UseMiddleware(authMiddleware, LogOperationMiddleware)
  async createComment(
    @Arg('input') input: CreateCommentInput,
    @Ctx() context: any,
  ): Promise<CommentResponse> {
    try {
        const { uid } = context.user;
        const user = await this.usersService.findByFirebaseUid(uid);

        if (!user || !user.id) {
          throw new ValidationError('User is not authenticated');
        }

      // 创建评论，确保返回完整的关联数据
        const comment = await this.commentService.create({
            ...input,
            user_id: user.id, 
          });

      // 确保返回的数据符合 CommentResponse 类型
      return {
        success: true,
        comment,
      };    

    } catch (error) {
      // 返回错误响应
      return {
        success: false,
        errors: [{
          field: 'comment',
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        }]
      };
    }
  }


  @Mutation(() => BaseResponse)
  @UseMiddleware(authMiddleware, LogOperationMiddleware)
  async deleteComment(
    @Arg('commentId', () => Int) commentId: number,
    @Ctx() context: any
  ): Promise<BaseResponse> {
    try {
      // 从 context 获取用户 ID
      const { uid } = context.user;
      const user = await this.usersService.findByFirebaseUid(uid);

      if (!user || !user.id) {
        return {
          success: false,
          errors: [{
            field: 'general',
            message: 'User not authenticated'
          }]
        };
      }

      const result = await this.commentService.deleteComment(commentId, user.id);

      if (!result.success) {
        return {
          success: false,
          errors: [{
            field: 'general',
            message: result.message || 'Failed to delete comment'
          }]
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to delete comment:', error);
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        }]
      };
    }
  }

}