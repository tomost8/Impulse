import { Resolver, Query, Mutation, Arg, Int } from 'type-graphql';
import { Service } from 'typedi';
import { User, CreateUserInput, UpdateUserInput } from './user.schema';
import { UserService } from './user.service';

/**
 * GraphQL resolver for User-related operations
 * 
 * This resolver provides the GraphQL API endpoints for user management,
 * including queries and mutations for CRUD operations.
 * 
 * @remarks
 * All methods are automatically exposed in the GraphQL schema
 * through type-graphql decorators.
 * 
 * @example
 * ```graphql
 * # Query all users
 * query {
 *   users {
 *     id
 *     email
 *     name
 *   }
 * }
 * ```
 */
@Service()
@Resolver(User)
export class UserResolver {
  constructor(private userService: UserService) {}

  /**
   * Query to fetch all users
   * 
   * @returns Array of all users in the system
   * 
   * @example
   * ```graphql
   * query {
   *   users {
   *     id
   *     email
   *     name
   *   }
   * }
   * ```
   */
  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.userService.findAll();
  }

  /**
   * Query to fetch a single user by ID
   * 
   * @param id - The ID of the user to fetch
   * @returns The user if found, null otherwise
   * 
   * @example
   * ```graphql
   * query {
   *   user(id: 1) {
   *     email
   *     name
   *   }
   * }
   * ```
   */
  @Query(() => User, { nullable: true })
  async user(@Arg('id', () => Int) id: number): Promise<User | null> {
    return this.userService.findById(id);
  }

  /**
   * Mutation to create a new user
   * 
   * @param input - User creation data
   * @returns The newly created user
   * 
   * @example
   * ```graphql
   * mutation {
   *   createUser(input: {
   *     email: "john@example.com"
   *     name: "John Doe"
   *   }) {
   *     id
   *     email
   *   }
   * }
   * ```
   */
  @Mutation(() => User)
  async createUser(@Arg('input') input: CreateUserInput): Promise<User> {
    return this.userService.create(input);
  }

  /**
   * Mutation to update an existing user
   * 
   * @param id - ID of the user to update
   * @param input - Updated user data
   * @returns The updated user
   * 
   * @example
   * ```graphql
   * mutation {
   *   updateUser(
   *     id: 1
   *     input: { name: "Jane Doe" }
   *   ) {
   *     id
   *     name
   *   }
   * }
   * ```
   */
  @Mutation(() => User)
  async updateUser(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdateUserInput
  ): Promise<User> {
    return this.userService.update(id, input);
  }

  /**
   * Mutation to delete a user
   * 
   * @param id - ID of the user to delete
   * @returns true if successful
   * 
   * @example
   * ```graphql
   * mutation {
   *   deleteUser(id: 1)
   * }
   * ```
   */
  @Mutation(() => Boolean)
  async deleteUser(@Arg('id', () => Int) id: number): Promise<boolean> {
    await this.userService.delete(id);
    return true;
  }
} 