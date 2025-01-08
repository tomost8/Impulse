import { Field, InputType, Int } from 'type-graphql';
import { IsInt, Length, IsOptional, IsString } from 'class-validator';

/**
 * Input type for creating a new community
 * 
 * @remarks
 * This type is used in the createCommunity mutation
 * 
 * @example
 * ```typescript
 * const input: CreateCommunityInput = {
      "name": "community name",
      "influencerId": 1,
      "description": "comunity description (optional)"
 * };
 * ```
 */
@InputType()
export class CreateCommunityInput {
  /** Community name */
  @Field(() => String)
  @IsString({ message: 'Community name must be a string' })
  @Length(1, 255, { message: 'Commuity name must between 1 and 255 characters' })
  name!: string;

  /** Optional community description */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Community description must be a string' })
  description?: string | null;

  /** Influencer user id */
  @Field(() => Int)
  @IsInt({ message: 'Influencer id must be an int' })
  influencerId!: number;
}

/**
 * Input type for updating an existing community
 * 
 * @remarks
 * All fields are optional as this is used for partial updates
 * 
 * @example
 * ```typescript
 * const update: UpdateCommunityInput = {
 *   "name": "updated name",
 *   "description": "updated description"
 * };
 * ```
 */
@InputType()
export class UpdateCommunityInput {
  /** Community name */
  @Field(() => String)
  @IsOptional()
  @IsString({ message: 'Community name must be a string' })
  @Length(1, 255, { message: 'Commuity name must between 1 and 255 characters' })
  name?: string;

  /** Optional community description */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Community description must be a string' })
  description?: string | null;
} 