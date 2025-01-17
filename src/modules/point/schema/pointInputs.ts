import { Field, InputType, Int } from 'type-graphql';
import { IsInt, Length, IsOptional, IsString, IsBoolean } from 'class-validator';
import { RequestStatus } from '../../common/types/enumTypes';

/**
 * Input type for updating a user's points
 * 
 * @remarks
 * All fields are optional as this is used for partial updates
 * 
 * @example
 * const update: UpdatePointInput = {
 *   points_added: 75
 * };
 */
@InputType()
export class UpdatePointInput {
  /** Points added */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Points added must be an int' })
  points_added?: number | null;

  /** reset weekly points */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'Reset weekly points must be a bool' })
  reset_weekly_points?: boolean | null;

  /** reset monthly points */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean({ message: 'Reset monthly points must be a bool' })
  reset_monthly_points?: boolean | null;
} 

/**
 * Input type for creating a new reward
 * 
 * @remarks
 * This type is used in the createReward mutation
 * 
 * @example
 * ```typescript
 * const input: CreateRewardInput = {
 *    title: "reward title",
 *    description: "reward description",
 *    required_points: 750
 * };
 * ```
 */
@InputType()
export class CreateRewardInput {
  /** Title */
  @Field(() => String)
  @IsString({ message: 'Reward title must be a string' })
  title!: string;

  /** Optional community description */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Reward description must be a string' })
  description?: string | null;

  /** Points required to redeem */
  @Field(() => Int)
  @IsInt({ message: 'Required points must be an int' })
  required_points!: number;
}

/**
 * Input type for updating a reward
 * 
 * @remarks
 * All fields are optional as this is used for partial updates
 * 
 * @example
 * const update: UpdateRewardInput = {
 *   description: "new description"
 * };
 */
@InputType()
export class UpdateRewardInput {
  /** Updated title */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Reward title must be a string' })
  title?: string | null;

  /** Updated community description */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Reward description must be a string' })
  description?: string | null;

  /** Updated number of points */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Required points must be an int' })
  required_points?: number | null;
} 


/**
 * Input type for creating a new redeem
 * 
 * @remarks
 * This type is used in the createRedeem mutation
 * 
 * @example
 * ```typescript
 * const input: CreateRedeemInput = {
 *    user_id: 1,
 *    reward_id: 1
 * };
 * ```
 */
@InputType()
export class CreateRedeemInput {
  /** User ID */
  @Field(() => Int)
  @IsInt({ message: 'User ID must be an int' })
  user_id!: number;

  /** Reward ID */
  @Field(() => Int)
  @IsInt({ message: 'Reward ID must be an int' })
  reward_id!: number;
}

/**
 * Input type for updating a redeem
 * 
 * @remarks
 * All fields are optional as this is used for partial updates
 * 
 * @example
 * const update: UpdateRedeemInput = {
 *   status: "ACCEPTED"
 * };
 */
@InputType()
export class UpdateRedeemInput {
  /** Updated status */
  @Field(() => RequestStatus, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Redeem status must be of type RequestStatus' })
  status?: RequestStatus | null;

  /** Updated processing time */
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsString({ message: 'processing time must be a date' })
  processing_time?: Date | null;
} 