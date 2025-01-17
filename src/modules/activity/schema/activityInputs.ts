import { InputType, Field, Int } from 'type-graphql';
import { IsString, IsOptional, IsInt, IsDate } from 'class-validator';

@InputType()
export class CreateActivityInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String)
  @IsString()
  category: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  duration?: number;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  scheduledDatetime?: Date;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  postId?: number;

  @Field(() => Int)
  @IsInt()
  userId: number;
}

@InputType()
export class UpdateActivityInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  category?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  duration?: number;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  scheduledDatetime?: Date;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  postId?: number;
} 