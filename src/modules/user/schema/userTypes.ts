import { Field, ObjectType, Int } from 'type-graphql';
import { IsEmail, Length, IsOptional, IsString } from 'class-validator';
import { FieldError } from '../../common/types/errorTypes';
import { DateScalar } from '../../common/scalars/dateScalar';
import { Category } from '../../common/types/enumTypes';
import { Point } from '../../point';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
export class WeeklyLoginStatus {
  /** Day label (S, M, T, W, TH, F, S) */
  @Field(() => String)
  label!: string;

  /** Whether the user has logged in on this day */
  @Field(() => Boolean)
  completed!: boolean;
}

@ObjectType()
export class LoginStreak {
  /** Current streak count */
  @Field(() => Int)
  streak_count!: number;

  /** Weekly login status - dates mapped to login counts */
  @Field(() => GraphQLJSON)
  weekly_logins!: Record<string, number>;

  /** Formatted weekly login status for frontend display */
  @Field(() => [WeeklyLoginStatus])
  formatted_weekly_logins!: WeeklyLoginStatus[];

  /** Last login date */
  @Field(() => Date, { nullable: true })
  last_login_date?: Date;
}

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

  /** User's age */
  @Field(() => Int, { nullable: true })
  age!: number | null;

  /** User's gender */
  @Field(() => String, { nullable: true })
  gender!: string | null;

  /** User's profile picture */
  @Field(() => String, { nullable: true })
  profile_picture!: string | null;

  /** User's bio */
  @Field(() => String, { nullable: true })
  bio!: string | null;

  /** User's bio */
  @Field(() => Category, { nullable: true })
  primary_goal!: Category | null;

  /** User's bio */
  @Field(() => Category, { nullable: true })
  secondary_goal!: Category | null;

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

  /** Whether user has double camera enabled */
  @Field(() => Boolean)
  is_double_cam!: boolean;

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

  /** User's point information */
  @Field(() => Point, { nullable: true })
  point!: Point | null;

  @Field(() => String, { nullable: true })
  referral_code!: string | null;

}

@ObjectType()
export class UserWithStreak extends User {
  /** User's login streak information */
  @Field(() => LoginStreak, { nullable: true })
  login_streak!: LoginStreak | null;
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
export class UserWithStreakResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => UserWithStreak, { nullable: true })
  user?: UserWithStreak;

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

@ObjectType()
export class UserCreatedPayload {
  @Field(() => User)
  user!: User;
}

@ObjectType()
export class UserLoginStreakResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => LoginStreak, { nullable: true })
  login_streak?: LoginStreak;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}