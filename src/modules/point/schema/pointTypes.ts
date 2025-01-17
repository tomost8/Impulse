import { Field, ObjectType, Int } from 'type-graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { User } from '../../user/schema/userTypes';
import { Chat } from '../../chat/schema/chatTypes';
import { RequestStatus } from '../../common/types/enumTypes';
import { FieldError } from '../../common/types/errorTypes';

/**
 * Point entity representing user's points in the system
 * 
 * This class defines the structure of a point system 
 * and is used both as a GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const point: Point = {
 * };
 * ```
 */
@ObjectType()
export class Point {
  /** User whose points are tracked */
  @Field(() => User)
  user!: User;

  /** User ID */
  @Field(() => Int)
  user_id!: number;

  /** Total points accumulated */
  @Field(() => Int)
  points!: number;

  /** Total points available to spend on redeems */
  @Field(() => Int)
  spending_points!: number;

  /** Weekly points */
  @Field(() => Int)
  weekly_points!: number;

  /** Monthly points */
  @Field(() => Int)
  monthly_points!: number;

  /** status - honestly no idea what this is */
  @Field(() => String)
  status!: string;

  /** preferences */
  @Field(() => GraphQLJSON, { nullable: true })
  preferences!: any | null;

  /** Timestamp of the when created */
  @Field(() => Date)
  created_at!: Date;

  /** Timestamp of the when updated */
  @Field(() => Date)
  updated_at!: Date;

  /** weekly update at */
  @Field(() => Date, { nullable: true })
  weekly_update_at!: Date | null;

  /** weekly update at */
  @Field(() => Date, { nullable: true })
  monthly_update_at!: Date | null;
}


@ObjectType()
export class PointResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => Point, { nullable: true })
  point?: Point;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class PointsResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Point], { nullable: true })
  points?: Point[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 

/**
 * Reward entity representing rewards in the system
 * 
 * This class defines the structure of a reward
 * and is used both as a GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const reward: Reward = {
 * };
 * ```
 */
@ObjectType()
export class Reward {
  /** Unique identifier for the reward */
  @Field(() => Int)
  id!: number;

  /** title/name of the reward */
  @Field(() => String)
  title!: string;

  /** description of the reward */
  @Field(() => String, { nullable: true })
  description!: string | null;

  /** points required to redeem reward */
  @Field(() => Int)
  required_points!: number;

  /** Timestamp of the when created */
  @Field(() => Date)
  created_at!: Date;

  /** Timestamp of the when updated */
  @Field(() => Date)
  updated_at!: Date;
}


@ObjectType()
export class RewardResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => Reward, { nullable: true })
  reward?: Reward;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class RewardsResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Reward], { nullable: true })
  rewards?: Reward[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 


/**
 * Redeem entity representing a user redeem in the system
 * 
 * This class defines the structure of a redeem
 * and is used both as a GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const redeem: Redeem = {
 * };
 * ```
 */
@ObjectType()
export class Redeem {
  /** Unique identifier for the reward */
  @Field(() => Int)
  id!: number;

  /** User who is redeeming */
  @Field(() => User)
  user!: User;

  /** User ID */
  @Field(() => Int)
  user_id!: number;

  /** Reward that is being redeemed */
  @Field(() => Reward)
  reward!: Reward;

  /** Reward ID */
  @Field(() => Int)
  reward_id!: number;

  /** Points spent on the redeem */
  @Field(() => Int)
  points_spent!: number;

  /** status of redeem request */
  @Field(() => RequestStatus)
  status!: RequestStatus;

  /** payment details */
  @Field(() => GraphQLJSON, { nullable: true })
  payment_details!: any | null;

  /** processing time */
  @Field(() => Date, { nullable: true })
  processing_time!: Date | null;

  /** notes */
  @Field(() => String, { nullable: true })
  notes!: string | null;

  /** Timestamp of the when created */
  @Field(() => Date)
  created_at!: Date;

  /** Timestamp of the when updated */
  @Field(() => Date)
  updated_at!: Date;
}


@ObjectType()
export class RedeemResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => Redeem, { nullable: true })
  redeem?: Redeem;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class RedeemsResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Redeem], { nullable: true })
  redeems?: Redeem[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 