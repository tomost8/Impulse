import { Field, InputType } from 'type-graphql';
import { IsEmail, Length, IsOptional, IsString } from 'class-validator';

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