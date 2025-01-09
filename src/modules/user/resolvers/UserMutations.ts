import { Resolver, Mutation, Arg, Int, UseMiddleware, Ctx } from 'type-graphql';
import { Service } from 'typedi';
import { User, UserResponse } from '../schema/userTypes';
import { CreateUserInput, UpdateUserInput } from '../schema/userInputs';
import { UsersService } from '../../../services/userService';
import { ValidationError } from '../../common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';
import { authMiddleware } from '../../../middleware/authMiddleware';

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
@UseMiddleware(LogOperationMiddleware)
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
  // @Mutation(() => UserResponse)
  // async createUser(@Arg('input') input: CreateUserInput): Promise<UserResponse> {
  //   try {
  //     const user = await this.usersService.create(input);
      
  //     logger.info('User creation successful', { 
  //       userId: user.id,
  //       email: user.email 
  //     });

  //     return {
  //       success: true,
  //       user
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       errors: [{
  //         field: error instanceof ValidationError ? 'email' : 'general',
  //         message: error instanceof Error ? error.message : 'Failed to create user'
  //       }]
  //     };
  //   }
  // }

  /**
   * Mutation to update the current user's profile
   * 
   * @param input - Updated user data
   * @returns Response containing the updated user or error details
   * 
   * @example
   * ```graphql
   * mutation {
   *   updateUser(
   *     input: { 
   *       first_name: "John",
   *       last_name: "Doe"
   *     }
   *   ) {
   *     success
   *     user {
   *       id
   *       first_name
   *       last_name
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
  @UseMiddleware(authMiddleware)
  async updateUser(
    @Ctx() context: any,
    @Arg('input') input: UpdateUserInput
  ): Promise<UserResponse> {
    try {
      const { uid } = context.user;
      const updatedUser = await this.usersService.updateByFirebaseUid(uid, input);
      
      logger.info('User profile update successful', { 
        userId: updatedUser.id,
        updates: input
      });

      return {
        success: true,
        user: updatedUser
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'profile',
          message: error instanceof Error ? error.message : 'Failed to update profile'
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
      
      logger.info('User deletion successful', { userId: id });

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

  @Mutation(() => UserResponse)
  @UseMiddleware(authMiddleware)
  async firebaseAuth(@Ctx() context: any): Promise<UserResponse> {
    try {
      const { uid, email } = context.user;
      
      // find user by firebase uid
      let user = await this.usersService.findByFirebaseUid(uid);
      
      if (!user) {
        // if user not found, create new user
        user = await this.usersService.create({
          email: email || 'test@example.com',  // 使用 token 中的邮箱或默认值
          firebase_uid: uid,
        });
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'auth',
          message: error instanceof Error ? error.message : 'Authentication failed'
        }]
      };
    }
  }
} 