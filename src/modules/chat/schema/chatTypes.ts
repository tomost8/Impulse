import { Field, ObjectType, Int } from 'type-graphql';
import { User } from '../../user/schema/userTypes';
import { Role, RequestStatus } from '../../common/types/enumTypes';
import { Post } from '../../post/schema/postTypes';
import { FieldError } from '../../common/types/errorTypes';

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
  @Field(() => User, { nullable: true })
  creator!: User | null;

  /** ID of user who created chat */
  @Field(() => Int, { nullable: true })
  creator_id!: number | null;

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
  @Field(() => Role)
  role!: Role;

  /** Status of user in chat */
  @Field(() => RequestStatus)
  status!: RequestStatus;

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


/**
 * Message entity representing a chat message in the system
 * 
 * This class defines the structure of a message 
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
export class UserChatPreview {
  @Field(() => Chat)
  chat!: Chat;

  @Field(() => Role)
  role!: Role;

  @Field(() => RequestStatus)
  status!: RequestStatus;

  @Field(() => Message, { nullable: true })
  lastMessage?: Message | null;

  @Field(() => Int)
  unreadCount!: number;

  @Field(() => Int, { nullable: true })
  lastReadMessageId?: number | null;

  @Field(() => Date, { nullable: true })
  lastReadAt?: Date | null;
}

@ObjectType()
export class UserChatsResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [UserChatPreview], { nullable: true })
  chats?: UserChatPreview[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class Message {
  /** Unique identifier for message */
  @Field(() => Int)
  id!: number;

  /** Chat */
  @Field(() => Chat)
  chat!: Chat;

  /** Chat ID */
  @Field(() => Int)
  chat_id!: number;

  /** Message sender */
  @Field(() => User)
  sender!: User;

  /** Message sender ID */
  @Field(() => Int)
  sender_id!: number;

  /** Content of message (null if post) */
  @Field(() => String, { nullable: true })
  content!: string | null;

  /** Post that message is linked to (null if not linked) */
  @Field(() => Post, { nullable: true })
  post!: Post | null;

  /** ID of linked post (null if not linked) */
  @Field(() => Int, { nullable: true })
  post_id!: number | null;

  /** Timestamp of the when message was sent */
  @Field(() => Date)
  created_at!: Date;
}

@ObjectType()
export class MessageResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => Message, { nullable: true })
  message?: Message;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class MessagesResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Message], { nullable: true })
  messages?: Message[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class MessagePageInfo {
  @Field(() => Boolean)
  hasMore!: boolean;

  @Field(() => Int, { nullable: true })
  lastMessageId?: number | null;

  @Field(() => Date, { nullable: true })
  lastCreatedAt?: Date | null;
}

@ObjectType()
export class PaginatedMessagesResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Message], { nullable: true })
  messages?: Message[];

  @Field(() => MessagePageInfo, { nullable: true })
  pageInfo?: MessagePageInfo;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class ChatListEntry {
  @Field(() => Chat)
  chat!: Chat;

  @Field(() => Message, { nullable: true })
  lastMessage?: Message | null;

  @Field(() => Int)
  unreadCount!: number;

  @Field(() => Int, { nullable: true })
  lastReadMessageId?: number | null;

  @Field(() => Date, { nullable: true })
  lastReadAt?: Date | null;
}

@ObjectType()
export class ChatListResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [ChatListEntry], { nullable: true })
  chats?: ChatListEntry[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}