import { Field, ObjectType, InputType, Int } from 'type-graphql';
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

  /** Optional display name */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string | null;

  /** Optional Firebase UID */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Firebase UID must be a string' })
  firebaseUid?: string | null;
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
  /** New email address */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @Length(5, 255, { message: 'Email must be between 5 and 255 characters' })
  email?: string;

  /** New display name */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string | null;

  /** New Firebase UID */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: 'Firebase UID must be a string' })
  firebaseUid?: string | null;
} 