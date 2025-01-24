import { ObjectType, Field, Int } from 'type-graphql';
import { User } from '../../user/schema/userTypes';
import { Post } from '../../post/schema/postTypes';
import { FieldError } from '../../common/types/errorTypes';
@ObjectType()
export class Comment {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  post_id: number;

  @Field(() => Int)
  user_id: number;

  @Field(() => String)
  content: string;

  @Field(() => Post, { nullable: true }) // 标记为可选
  post?: Post | null;

  @Field(() => User, { nullable: true }) // 标记为可选
  user?: User | null;

  @Field(() => Comment, { nullable: true }) // 父评论可选
  parent_comment?: Comment | null;

  @Field(() => Int, { nullable: true })
  parent_comment_id?: number | null;

  @Field(() => [Comment], { nullable: true }) // 子评论可选
  replies?: Comment[] | null;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
}



@ObjectType()
export class CommentResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => Comment, { nullable: true })
  comment?: Comment;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class CommentsResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}
