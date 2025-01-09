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
 *    "name": "community name",
 *    "description": "community description (optional)",
 *    "thumbnail": "community thumbnail (optional)"
 *    "influencer_id": 1
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

  /** Optional community thumbnail */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Community thumbnail must be a string' })
  thumbnail?: string | null;

  /** Influencer user id */
  @Field(() => Int)
  @IsInt({ message: 'Influencer id must be an int' })
  influencer_id!: number;
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
 *   "name": "updated community name",
 *   "description": "updated community description",
 *   "thumbnail": "updated community thumbnail"
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

  /** Optional community thumbnail */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Community thumbnail must be a string' })
  thumbnail?: string | null;
} 


/**
 * Input type for creating a new community/user relation
 * 
 * @remarks
 * This type is used in the createCommunityMember mutation
 * 
 * @example
 * ```typescript
 * const input: CreateCommunityMemberInput = {
 *    "community_id": 1,
 *    "user_id": 1
 * };
 * ```
 */
@InputType()
export class CreateCommunityMemberInput {
  /** Community ID */
  @Field(() => Int)
  @IsInt({ message: 'Community id must be an int' })
  community_id!: number;

  /** User ID */
  @Field(() => Int)
  @IsInt({ message: 'User id must be an int' })
  user_id!: number;
}

/**
 * Input type for updating a new community/user relation
 * 
 * @remarks
 * All fields are optional as this is used for partial updates
 * 
 * @example
 * const update: UpdateCommunityInput = {
 *   "role": "member",
 *   "status": "approved"
 * };
 */
@InputType()
export class UpdateCommunityMemberInput {
  /** User role in community (optional) */
  @Field(() => String, { nullable: true })
  //@IsOptional()
  @IsString({ message: 'User role must be a string' })
  role!: string;

  /** User status in community (optional) */
  @Field(() => String, { nullable: true })
  //@IsOptional()
  @IsString({ message: 'User status must be a string' })
  status!: string;
} 