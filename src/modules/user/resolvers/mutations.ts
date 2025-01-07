import { Resolver, Mutation, Arg, Int } from 'type-graphql';
import { Service } from 'typedi';
import { User, UserResponse } from '../schema/types';
import { CreateUserInput, UpdateUserInput } from '../schema/inputs';
import { UsersService } from '../../../services/userService';
import { ValidationError } from '../../../modules/common/errors/graphql.error';

/**
 * GraphQL mutation resolvers for User-related operations
 * 
 * @example
 * ```graphql
 * mutation {
 *   createUser(input: {
 *     email: "john@example.com"
 *     name: "John Doe"
 *   }) {
 *     success
 *     user {
 *       id
 *       email
 *     }
 *     errors {
 *       field
 *       message
 *     }
 *   }
 * }
 * ```
 */
@Service()
@Resolver(User)
export class UserMutations {
  constructor(private usersService: UsersService) {}

  /**
   * Mutation to create a new user
   * 
   * @param input - User creation data
   * @returns Response containing the newly created user or error details
   * 
   * @example
   * ```graphql
   * mutation {
   *   createUser(input: {
   *     email: "john@example.com"
   *     name: "John Doe"
   *   }) {
   *     success
   *     user {
   *       id
   *       email
   *     }
   *     errors {
   *       field
   *       message
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => UserResponse)
  async createUser(@Arg('input') input: CreateUserInput): Promise<UserResponse> {
    try {
      const user = await this.usersService.create(input);
      return {
        success: true,
        user
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          errors: [{
            field: 'email',
            message: error.message
          }]
        };
      }
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create user'
        }]
      };
    }
  }

  /**
   * Mutation to update an existing user
   * 
   * @param id - ID of the user to update
   * @param input - Updated user data
   * @returns Response containing the updated user or error details
   * 
   * @example
   * ```graphql
   * mutation {
   *   updateUser(
   *     id: 1
   *     input: { name: "Jane Doe" }
   *   ) {
   *     success
   *     user {
   *       id
   *       name
   *     }
   *     errors {
   *       field
   *       message
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => UserResponse)
  async updateUser(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdateUserInput
  ): Promise<UserResponse> {
    try {
      const user = await this.usersService.update(id, input);
      return {
        success: true,
        user
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update user'
        }]
      };
    }
  }

  /**
   * Mutation to delete a user
   * 
   * @param id - ID of the user to delete
   * @returns Response indicating success or failure
   * 
   * @example
   * ```graphql
   * mutation {
   *   deleteUser(id: 1) {
   *     success
   *     errors {
   *       field
   *       message
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => UserResponse)
  async deleteUser(@Arg('id', () => Int) id: number): Promise<UserResponse> {
    try {
      await this.usersService.delete(id);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete user'
        }]
      };
    }
  }
} 