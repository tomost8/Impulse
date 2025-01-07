import { Field, ObjectType, Int } from 'type-graphql';
import { IsEmail, Length, IsOptional, IsString } from 'class-validator';

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

  /** User's display name */
  @Field(() => String, { nullable: true })
  name!: string | null;

  /** Firebase authentication UID */
  @Field(() => String, { nullable: true })
  firebaseUid!: string | null;

  /** Timestamp of when the user was created */
  @Field(() => Date)
  createdAt!: Date;

  /** Timestamp of the last update to the user */
  @Field(() => Date)
  updatedAt!: Date;
}

@ObjectType()
export class FieldError {
  @Field(() => String)
  field!: string;

  @Field(() => String)
  message!: string;
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