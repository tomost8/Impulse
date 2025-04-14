import { Field, InputType, Int } from 'type-graphql';
import { IsEmail, Length, IsOptional, IsString, IsDate } from 'class-validator';
import { DateScalar } from '../../common/scalars/dateScalar';
import { Category } from '../../common/types/enumTypes';

/**
 * Input type for creating a new user
 * 
 * @remarks
 * This type is used in the createUser mutation
 * 
 * @example
 * ```typescript
 * const input: CreateUserInput = {
 *   email: "john@example.com",
 *   name: "John Doe",
 *   firebaseUid: "firebase123"
 * };
 * ```
 */
@InputType()
export class CreateUserInput {
  /** Email address for the new user */
  @Field(() => String)
  @IsEmail({}, { message: 'Invalid email format' })
  @Length(5, 255, { message: 'Email must be between 5 and 255 characters' })
  email!: string;

  /** Firebase UID */
  @Field(() => String)
  firebase_uid!: string;

  /** First name of the new user */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters' })
  first_name?: string;

  /** Last name of the new user */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters' })
  last_name?: string;

  /** Username of the new user */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(2, 100, { message: 'Username must be between 2 and 100 characters' })
  username?: string;

  /** Date of birth of the new user */
  @Field(() => DateScalar, { nullable: true })
  @IsOptional()
  dob?: Date;

  /** Age of the new user */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  age?: number;

  /** Gender of the new user */
  @Field(() => String, { nullable: true })
  @IsOptional()
  gender?: string;

  /** Profile picture of the new user */
  @Field(() => String, { nullable: true })
  @IsOptional()
  profile_picture?: string;

  /** Bio of the new user */
  @Field(() => String, { nullable: true })
  @IsOptional()
  bio?: string;

  /** Timezone of the new user */
  @Field(() => String, { nullable: true })
  @IsOptional()
  timezone?: string;

  /** Whether the user should be searchable */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  searchable?: boolean;

  /** Primary goal of the new user */
  @Field(() => Category, { nullable: true })
  @IsOptional()
  primary_goal?: Category;

  /** Secondary goal of the new user */ 
  @Field(() => Category, { nullable: true })
  @IsOptional()
  secondary_goal?: Category;

  /** FCM token for the new user */
  @Field(() => String, { nullable: true })
  @IsOptional()
  fcm_token?: string;

}

/**
 * Input type for updating an existing user
 * 
 * @remarks
 * All fields are optional as this is used for partial updates
 * 
 * @example
 * ```typescript
 * const update: UpdateUserInput = {
 *   name: "Jane Doe"
 * };
 * ```
 */
@InputType()
export class UpdateUserInput {
  /** First name */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters' })
  first_name?: string;

  /** Last name */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters' })
  last_name?: string;

  /** Username */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(2, 100, { message: 'Username must be between 2 and 100 characters' })
  username?: string;

  /** Date of birth */
  @Field(() => DateScalar, { nullable: true })
  @IsOptional()
  dob?: Date;

  /** Gender */
  @Field(() => String, { nullable: true })
  @IsOptional()
  gender?: string;

  /** Profile picture */
  @Field(() => String, { nullable: true })
  @IsOptional()
  profile_picture?: string;

  /** Bio */
  @Field(() => String, { nullable: true })
  @IsOptional()
  bio?: string;

  /** Age */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  age?: number;

  /** Primary Goal */
  @Field(() => Category, { nullable: true })
  @IsOptional()
  primary_goal?: Category;

  /** Secondary Goal */
  @Field(() => Category, { nullable: true })
  @IsOptional()
  secondary_goal?: Category;

  /** Timezone */
  @Field(() => String, { nullable: true })
  @IsOptional()
  timezone?: string;

  /** Whether the user should be searchable */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  searchable?: boolean;

  /** Whether user has double camera enabled */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  is_double_cam?: boolean;

  /** FCM token */
  @Field(() => String, { nullable: true })
  @IsOptional()
  fcm_token?: string;

  /** User's new role */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(1, 50, { message: 'Role must be between 1 and 50 characters' })
  role?: string;

  /** User's status */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(1, 50, { message: 'Status must be between 1 and 50 characters' })
  status?: string;
}
