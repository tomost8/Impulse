import { Field, InputType, Int } from 'type-graphql';
import { IsInt, Length, IsOptional, IsString, IsEnum } from 'class-validator';
import { Role, RequestStatus } from '../../common/types/enumTypes';

/**
 * Input type for creating a new chat
 * 
 * @remarks
 * This type is used in the createChat mutation
 * 
 * @example
 * ```typescript
 * const input: CreateChatInput = {
 *    type: "direct",
 *    title: "chat name (depends on type)",
 *    password: "chat password (optional)",
 *    profile_pic: "chat profile pic (optional)",
 *    creator_id: 1
 * };
 * ```
 */
@InputType()
export class CreateChatInput {
  /** Chat type */
  @Field(() => String)
  @IsString({ message: 'Chat type must be a string' })
  type!: string;

  /** Chat title */
  @Field(() => String)
  @IsOptional()
  @IsString({ message: 'Chat title must be a string' })
  @Length(1, 255, { message: 'Chat title must between 1 and 255 characters' })
  title?: string | null;

  /** Optional chat password */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Chat password must be a string' })
  password?: string | null;

  /** Optional chat profile picture */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Chat profile picture must be a string' })
  profile_pic?: string | null;

  /** Creator id */
  @Field(() => Int)
  @IsInt({ message: 'Creator id must be an int' })
  creator_id!: number;
}

/**
 * Input type for updating an existing chat
 * 
 * @remarks
 * All fields are optional as this is used for partial updates
 * 
 * @example
 * ```typescript
 * const update: UpdateChatInput = {
 *    title: "chat name (depends on type)",
 *    password: "chat password (optional)",
 *    profile_pic: "chat profile pic (optional)"
 * };
 * ```
 */
@InputType()
export class UpdateChatInput {
  /** Chat title */
  @Field(() => String)
  @IsOptional()
  @IsString({ message: 'Chat title must be a string' })
  @Length(1, 255, { message: 'Chat title must between 1 and 255 characters' })
  title?: string | null;

  /** Optional chat password */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Chat password must be a string' })
  password?: string | null;

  /** Optional chat profile picture */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Chat profile picture must be a string' })
  profile_pic?: string | null;
} 


/**
 * Input type for creating a new chat/user relation
 * 
 * @remarks
 * This type is used in the createChatMember mutation
 * 
 * @example
 * ```typescript
 * const input: CreateChatMemberInput = {
 *    chat_id: 1,
 *    user_id: 1
 * };
 * ```
 */
@InputType()
export class CreateChatMemberInput {
  /** Chat ID */
  @Field(() => Int)
  @IsInt({ message: 'Chat id must be an int' })
  chat_id!: number;

  /** User ID */
  @Field(() => Int)
  @IsInt({ message: 'User id must be an int' })
  user_id!: number;

  /** Status */
  @Field(() => RequestStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Status must be a RequestStatus' })
  status?: RequestStatus;
}

/**
 * Input type for updating a new chat/user relation
 * 
 * @remarks
 * All fields are optional as this is used for partial updates
 * 
 * @example
 * const update: UpdateChatInput = {
 *   role: "member",
 *   status: "approved"
 * };
 */
@InputType()
export class UpdateChatMemberInput {
  /** User role in chat (optional) */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(Role, { message: 'User role must be one of the valid Role values' })
  role?: Role;

  /** User status in chat (optional) */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'User status must be one of the valid RequestStatus values' })
  status?: RequestStatus;
} 


/**
 * Input type for creating a new message
 * 
 * @remarks
 * This type is used in the createMessage mutation
 * 
 * @example
 * ```typescript
 * const input: CreateMessageInput = {
 *    chat_id: 1,
 *    user_id: 1,
 *    post_id: 1
 * };
 * ```
 */
@InputType()
export class CreateMessageInput {
  /** Chat ID */
  @Field(() => Int)
  @IsInt({ message: 'Chat id must be an int' })
  chat_id!: number;

  /** Sender ID */
  @Field(() => Int)
  @IsInt({ message: 'User id must be an int' })
  sender_id!: number;

  /** Message content */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Message must be a string' })
  content?: string | null;

  /** Post ID */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Post ID must be an int' })
  post_id?: number | null;
}