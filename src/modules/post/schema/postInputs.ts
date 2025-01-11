import { InputType, Field, Int } from 'type-graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { IsString, IsOptional, IsInt, IsBoolean, IsArray, IsDate } from 'class-validator';

@InputType()
export class CreatePostInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  caption?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  media_urls?: any;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  expires_at?: Date;

  @Field(() => [CreatePostTargetInput], { nullable: true })
  @IsArray()
  @IsOptional()
  post_targets?: CreatePostTargetInput[];
}

@InputType()
export class UpdatePostInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  caption?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  media_urls?: any;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  is_deleted?: boolean;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
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

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  target_type?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  target_id?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  skip?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  take?: number;
} 