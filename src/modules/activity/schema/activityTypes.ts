import { ObjectType, Field, Int } from 'type-graphql';
import { Post } from '../../post/schema/postTypes';
import { FieldError } from '../../common/types/errorTypes';

@ObjectType()
export class Activity {
  @Field(() => Int)
  id: number;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String)
  category: string;

  @Field(() => Int, { nullable: true })
  duration: number | null;

  @Field(() => Date, { nullable: true })
  scheduledDatetime: Date | null;

  @Field(() => String)
  status: string;

  @Field(() => Post, { nullable: true })
  post: Post | null;

  @Field(() => Int, { nullable: true })
  postId: number | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => Int)
  userId: number;
}

@ObjectType()
export class ActivityResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => Activity, { nullable: true })
  activity?: Activity;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class ActivitiesResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => [Activity], { nullable: true })
  activities?: Activity[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}
