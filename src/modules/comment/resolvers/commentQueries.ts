import { Int, Query } from "type-graphql";
import { CommentsResponse } from "../ scheme/commentTypes";

import { Resolver, Mutation, Arg, Ctx, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';

import { CommentService } from '../../../services/commentService';
import { ValidationError } from '../../common/errors/graphql.error';
import { Comment, CommentResponse } from '../ scheme/commentTypes';
import { CreateCommentInput } from '../ scheme/commentInputs';
import { UsersService } from '../../../services/userService';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';



@Service()
@Resolver(Comment)
export class CommentQueries {
  constructor(
    private commentService: CommentService,
    private usersService: UsersService
  ) {}




@Query(() => CommentsResponse)
async postComments(
  @Arg('postId', () => Int) postId: number,
  @Arg('skip', () => Int, { nullable: true }) skip = 0,
  @Arg('take', () => Int, { nullable: true }) take = 10
): Promise<CommentsResponse> {
  try {
    const comments = await this.commentService.findCommentsByPostId(postId, {
      skip,
      take,
    });

    return {
      success: true,
      comments,
    };
  } catch (error) {
    console.error(`Failed to fetch comments for post ${postId}:`, error);
    return {
      success: false,
      errors: [
        {
          field: 'general',
          message:
            error instanceof Error ? error.message : 'Failed to fetch comments',
        },
      ],
    };
  }
}
}