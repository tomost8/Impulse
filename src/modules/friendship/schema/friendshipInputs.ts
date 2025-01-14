import { Field, InputType, Int } from 'type-graphql';
import { IsInt, Length, IsOptional, IsString, IsEnum } from 'class-validator';
import { RequestStatus } from '../../common/types/enumTypes';

/**
 * Input type for creating a new friendship relation
 * 
 * @remarks
 * This type is used in the createFriendship mutation
 * 
 * @example
 * ```typescript
 * const input: CreateFriendshipInput = {
 *    sender_id: 1,
 *    receiver_id: 1
 * };
 * ```
 */
@InputType()
export class CreateFriendshipInput {
  /** Sender ID */
  @Field(() => Int)
  @IsInt({ message: 'Sender id must be an int' })
  sender_id!: number;

  /** Receiver ID */
  @Field(() => Int)
  @IsInt({ message: 'Receiver id must be an int' })
  receiver_id!: number;
}

/**
 * Input type for updating a friendship relation
 * 
 * @remarks
 * There is only one field so it is not optional
 * 
 * @example
 * const update: UpdateFriendshipInput = {
 *   status: "ACCEPTED"
 * };
 */
@InputType()
export class UpdateFriendshipInput {
  /** Friendship status */
  @Field(() => RequestStatus)
  @IsEnum(RequestStatus, { message: 'status must be one of the valid RequestStatus values' })
  status!: RequestStatus;
} 