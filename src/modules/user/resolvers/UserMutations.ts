import { Resolver, Mutation, Arg, Int, UseMiddleware, Ctx } from 'type-graphql';
import { Service } from 'typedi';
import { User, UserResponse, UserWithStreak, UserWithStreakResponse } from '../schema/userTypes';
import { CreateUserInput, UpdateUserInput } from '../schema/userInputs';
import { UsersService } from '../../../services/userService';
import { ValidationError } from '../../common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';
import { authMiddleware } from '../../../middleware/authMiddleware';

/**
 * GraphQL mutation resolvers for User-related operations
 * 
 * This resolver class handles all user mutations including:
 * - User profile updates
 * - User deletion
 * - Firebase authentication integration
 * 
 * @remarks
 * All mutations return a UserResponse type that includes:
 * - success: boolean indicating operation success
 * - user: the affected user (if applicable)
 * - errors: array of validation or operation errors
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
   * Mutation to update the current user's profile
   * 
   * This mutation requires authentication and updates the profile of the currently
   * logged-in user. It uses the Firebase UID from the authentication context to
   * identify the user.
   * 
   * @param context - GraphQL context containing authenticated user information
   * @param input - Updated user data containing fields to modify
   * @returns UserResponse with the updated user or error details
   * @throws {ValidationError} If the update validation fails
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
   * Mutation to delete a user from the system
   * 
   * This mutation permanently removes a user and all associated data.
   * It should be used with caution as the operation cannot be undone.
   * 
   * @param id - ID of the user to delete
   * @returns UserResponse indicating operation success or failure
   * @throws {NotFoundError} If the user doesn't exist
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

  /**
   * Mutation to handle Firebase authentication and user creation/retrieval
   * 
   * This mutation is called after successful Firebase authentication to either:
   * 1. Retrieve an existing user based on Firebase UID
   * 2. Create a new user if one doesn't exist for the Firebase UID
   * 
   * @param context - GraphQL context containing Firebase user information
   * @returns UserResponse with the authenticated user or error details
   * @throws {ValidationError} If user creation/retrieval fails
   * 
   * @example
   * ```graphql
   * mutation {
   *   firebaseAuth {
   *     success
   *     user {
   *       id
   *       email
   *       firebase_uid
   *     }
   *     errors {
   *       field
   *       message
   *     }
   *   }
   * }
   * ```
   */
  @Mutation(() => UserWithStreakResponse)
  @UseMiddleware(authMiddleware)
  async firebaseAuth(@Ctx() context: any): Promise<UserWithStreakResponse> {
    try {
      const { uid, email } = context.user;
      
      // Find user by firebase uid
      let user = await this.usersService.findByFirebaseUid(uid);
      
      if (!user) {
        // Create new user if not found
        user = await this.usersService.create({
          email: email || 'test@example.com',  // Use email from token or default
          firebase_uid: uid,
        });
      }

      return {
        success: true,
        user: user as UserWithStreak
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