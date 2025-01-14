import { Field, ObjectType, Int } from 'type-graphql';
import { User } from '../../user/schema/userTypes';
import { RequestStatus } from '../../common/types/enumTypes';
import { FieldError } from '../../common/types/errorTypes';

/**
 * User/User entity representing a friendship in the system
 * 
 * This class defines the structure of a friendship relation 
 * and is used both as a GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const friendship: Friendship = {
 *   id: 54,
 *   sender: User,
 *   sender_id: 6,
 *   receiver: User,
 *   receiver_id: 20,
 *   status: "ACCEPTED",
 *   created_at: new Date(),
 *   updated_at: new Date()
 * };
 * ```
 */
@ObjectType()
export class Friendship {
  /** Unique identifier for the friendship */
  @Field(() => Int)
  id!: number;

  /** User who sent request */
  @Field(() => User)
  sender!: User;

  /** Sender ID */
  @Field(() => Int)
  sender_id!: number;

  /** User who received request */
  @Field(() => User)
  receiver!: User;

  /** Receiver ID */
  @Field(() => Int)
  receiver_id!: number;

  /** Status of user in community */
  @Field(() => RequestStatus)
  status!: RequestStatus;

  /** Timestamp of the when created */
  @Field(() => Date)
  created_at!: Date;

  /** Timestamp of the when updated */
  @Field(() => Date)
  updated_at!: Date;
}


@ObjectType()
export class FriendshipResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => Friendship, { nullable: true })
  friendship?: Friendship;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class FriendshipsResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Friendship], { nullable: true })
  friendships?: Friendship[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 