import { Field, ObjectType, Int } from 'type-graphql';
import { IsEmail, Length, IsOptional, IsString } from 'class-validator';
import { FieldError } from '../../common/types/errorTypes';
import { DateScalar } from '../../common/scalars/dateScalar';

/**
 * User entity representing a user in the system
 * 
 * This class defines the structure of a user and is used both as a
 * GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const user: User = {
 *   id: 1,
 *   email: "john@example.com",
 *   name: "John Doe",
 *   firebaseUid: "firebase123",
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
@ObjectType()
export class User {
  /** Unique identifier for the user */
  @Field(() => Int)
  id!: number;

  /** User's email address (unique) */
  @Field(() => String)
  email!: string;

  /** User's firebase uid */
  @Field(() => String, { nullable: true })
  firebase_uid!: string | null;

  /** User's first name */
  @Field(() => String, { nullable: true })
  first_name!: string | null;

  /** User's last name */
  @Field(() => String, { nullable: true })
  last_name!: string | null;

  /** User's username */
  @Field(() => String, { nullable: true })
  username!: string | null;

  /** User's date of birth */
  @Field(() => DateScalar, { nullable: true })
  dob!: Date | null;

  /** User's gender */
  @Field(() => String, { nullable: true })
  gender!: string | null;

  /** User's profile picture */
  @Field(() => String, { nullable: true })
  profile_picture!: string | null;

  /** User's role */
  @Field(() => String)
  role!: string;

  /** User's status */
  @Field(() => String)
  status!: string;

  /** User's timezone */
  @Field(() => String, { nullable: true })
  timezone!: string | null;

  /** User's searchable flag */
  @Field(() => Boolean)
  searchable!: boolean;

  /** User's FCM token */
  @Field(() => String, { nullable: true })
  fcm_token!: string | null;

  /** Timestamp of when the user was created */
  @Field(() => Date)
  created_at!: Date;

  /** Timestamp of the last update to the user */
  @Field(() => Date)
  updated_at!: Date;

  /** Timestamp of user's last login */
  @Field(() => Date, { nullable: true })
  last_login_at!: Date | null;
}

@ObjectType()
export class UserResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class UsersResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [User], { nullable: true })
  users?: User[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 