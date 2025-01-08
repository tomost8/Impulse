import { Field, ObjectType, Int } from 'type-graphql';
import { IsEmail, Length, IsOptional, IsString } from 'class-validator';
import { User, FieldError } from '../../user/schema/types';

/**
 * Community entity representing a community in the system
 * 
 * This class defines the structure of a community and is used both as a
 * GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const community: Community = {
 *   id: 1,
 *   name: "community name",
 *   description: "community description",
 *   influencer: User
 *   influencerId: 1
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
@ObjectType()
export class Community {
  /** Unique identifier for the community */
  @Field(() => Int)
  id!: number;

  /** Community name */
  @Field(() => String)
  name!: string;

  /** Community description */
  @Field(() => String, { nullable: true })
  description!: string | null;

  /** Influencer leading the community */
  @Field(() => User)
  influencer!: User;

  /** User ID of influencer leading the community */
  @Field(() => Int)
  influencerId!: number;

  /** Timestamp of when the community was created */
  @Field(() => Date)
  createdAt!: Date;

  /** Timestamp of the last update to the community */
  @Field(() => Date)
  updatedAt!: Date;
}

/*
@ObjectType()
export class FieldError {
  @Field(() => String)
  field!: string;

  @Field(() => String)
  message!: string;
}
*/

@ObjectType()
export class CommunityResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => Community, { nullable: true })
  community?: Community;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class CommunitiesResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Community], { nullable: true })
  communities?: Community[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 