import { Field, ObjectType, Int } from 'type-graphql';
import { IsEmail, Length, IsOptional, IsString } from 'class-validator';
import { User, FieldError } from '../../user/schema/userTypes';

/**
 * Chat entity representing a chat group in the system
 * 
 * This class defines the structure of a chat and is used both as a
 * GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const chat: Chat = {
 *   id: 1,
 *   type: "group",
 *   title: "chat group name",
 *   password: "secret",
 *   profile_pic: "profile picture",
 *   creator: User,
 *   creator_id: 1,
 *   created_at: new Date(),
 *   updated_at: new Date()
 * ```
 */
@ObjectType()
export class Chat {
  /** Unique identifier for the chat */
  @Field(() => Int)
  id!: number;

  /** Chat type (e.g. direct, group, community) */
  @Field(() => String)
  type!: string;

  /** Chat title */
  @Field(() => String, { nullable: true })
  title!: string | null;

  /** Chat password */
  @Field(() => String, { nullable: true })
  password!: string | null;

  /** Chat profile pic */
  @Field(() => String, { nullable: true })
  profile_pic!: string | null;

  /** User who created chat */
  @Field(() => User)
  creator!: User;

  /** ID of user who created chat */
  @Field(() => Int)
  creator_id!: number;

  /** Timestamp of when the chat was created */
  @Field(() => Date)
  created_at!: Date;

  /** Timestamp of the last update to the chat */
  @Field(() => Date)
  updated_at!: Date;
}

@ObjectType()
export class ChatResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => Chat, { nullable: true })
  chat?: Chat;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class ChatsResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Chat], { nullable: true })
  chats?: Chat[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 


/**
 * Chat/User entity representing a Chat/User member relation in the system
 * 
 * This class defines the structure of a Chat/User member relation 
 * and is used both as a GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const chat_member: ChatMember = {
 *   id: 54,
 *   chat: Chat,
 *   chat_id: 6,
 *   user: User
 *   user_id: 20,
 *   role: "member"
 *   status: "approved"
 *   updated_at: new Date()
 * };
 * ```
 */
@ObjectType()
export class ChatMember {
  /** Unique identifier for the chat/user relation */
  @Field(() => Int)
  id!: number;

  /** Chat */
  @Field(() => Chat)
  chat!: Chat;

  /** Chat ID */
  @Field(() => Int)
  chat_id!: number;

  /** User */
  @Field(() => User)
  user!: User;

  /** User ID */
  @Field(() => Int)
  user_id!: number;

  /** Role of user in chat */
  @Field(() => String)
  role!: string;

  /** Status of user in chat */
  @Field(() => String)
  status!: string;

  /** Timestamp of the when user joined chat */
  @Field(() => Date)
  joined_at!: Date;
}


@ObjectType()
export class ChatMemberResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => ChatMember, { nullable: true })
  chat_member?: ChatMember;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class ChatMembersResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [ChatMember], { nullable: true })
  chat_members?: ChatMember[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 