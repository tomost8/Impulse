import { InputType, Field, Int } from 'type-graphql';
import { IsString, IsOptional, IsInt, IsBoolean, IsArray, IsDate } from 'class-validator';

@InputType()
class PostTargetInput {
  @Field(() => String)
  target_type: string;

  @Field(() => Int)
  target_id: number;
}

@InputType()
export class CreatePostInput {
  @Field(() => String)
  caption: string;

  @Field(() => Int)
  activityId: number;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => Int)
  authorId: number;

  @Field(() => [PostTargetInput])
  post_targets: PostTargetInput[];

  @Field(() => [String], { nullable: true })
  mediaUrls?: string[];

  @Field(() => Date, { nullable: true })
  expires_at?: Date;
}

@InputType()
export class UpdatePostInput {
  @Field(() => String, { nullable: true })
  caption?: string;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field(() => [String], { nullable: true })
  mediaUrls?: string[];

  @Field(() => Date, { nullable: true })
  expires_at?: Date;
}

@InputType()
export class CreatePostTargetInput {
  @Field(() => String)
  @IsString()
  target_type: string;

  @Field(() => Int)
  @IsInt()
  target_id: number;
}

@InputType()
export class UpdatePostTargetInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  target_type?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  target_id?: number;
}

@InputType()
export class PostFilterInput {
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  author_id?: number;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  is_deleted?: boolean;

  @Field(() => String)
  @IsString()
  @IsOptional()
  target_type: string;

  @Field(() => Int)
  @IsInt()
  @IsOptional()
  target_id: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  skip?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  take?: number;
} 