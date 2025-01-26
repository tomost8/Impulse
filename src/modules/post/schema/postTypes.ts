import { ObjectType, Field, Int } from 'type-graphql';
import { User } from '../../user/schema/userTypes';
import { Activity } from '../../activity/schema/activityTypes';
import { FieldError } from '../../common/types/errorTypes';
import { Message } from '../../chat/schema/chatTypes';
import { Comment } from '../../comment/ scheme/commentTypes';

@ObjectType()
export class Post {
  @Field(() => Int)
  id: number;

  @Field(() => User)
  author: User;

  @Field(() => Int)
  author_id: number;

  @Field(() => String, { nullable: true })
  caption: string | null;

  @Field(() => String, { nullable: true })
  mediaUrl: string | null;

  @Field(() => Boolean)
  is_deleted: boolean;

  @Field(() => [Activity], { nullable: true })
  activities?: Activity[] | null;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;

  @Field(() => Date, { nullable: true })
  expires_at: Date | null;

  @Field(() => [PostTarget])
  post_targets: PostTarget[];

  @Field(() => [PostView], { nullable: true })
  post_views?: PostView[] | null;

  @Field(() => String, { nullable: true })
  category?: string | null;  

  @Field(() => [Message], { nullable: true })
  messages?: Message[] | null;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[];

  @Field(() => Boolean, { nullable: true })
  liked?: boolean; 

  @Field(() => Int, { nullable: true })
  likeCount?: number;
}

@ObjectType()
export class PostTarget {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  post_id: number;

  @Field(() => String)
  target_type: string;

  @Field(() => Int)
  target_id: number;

  @Field(() => Date)
  created_at: Date;

  @Field(() => Post, { nullable: true })
  post?: Post;
}

@ObjectType()
export class PostView {
  @Field(() => Int)
  id: number;

  @Field(() => Post, { nullable: true })
  post?: Post;

  @Field(() => Int)
  post_id: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Int)
  user_id: number;

  @Field(() => Date)
  viewed_at: Date;
}

@ObjectType()
export class PostResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => Post, { nullable: true })
  post?: Post;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class PostsResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => [Post], { nullable: true })
  posts?: Post[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class PostTargetsProgress {
  @Field()
  processed: number;

  @Field()
  total: number;

  @Field()
  status: string;
}

@ObjectType()
export class BaseResponse {
  @Field()
  success: boolean;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}
