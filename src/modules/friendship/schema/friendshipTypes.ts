import { Field, ObjectType, Int } from 'type-graphql';
import { User } from '../../user/schema/userTypes';
import { Chat } from '../../chat/schema/chatTypes';
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

  /** User */
  @Field(() => User)
  user!: User;

  /** User ID */
  @Field(() => Int)
  user_id!: number;

  /** Friend */
  @Field(() => User)
  friend!: User;

  /** Friend ID */
  @Field(() => Int)
  friend_id!: number;

  /** Status of user in community */
  @Field(() => RequestStatus)
  status!: RequestStatus;

  /** Direct chat between users */
  @Field(() => Chat, { nullable: true })
  chat!: Chat | null;

  /** Direct chat id */
  @Field(() => Int, { nullable: true })
  chat_id!: number | null;

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