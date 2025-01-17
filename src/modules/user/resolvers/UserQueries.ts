import { Resolver, Query, Arg, Int, UseMiddleware, Ctx } from 'type-graphql';
import { Service } from 'typedi';
import { User, UserResponse, UsersResponse } from '../schema/userTypes';
import { UsersService } from '../../../services/userService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import { authMiddleware, AuthContext } from '../../../middleware/authMiddleware';
import logger from '../../../config/logger';

/**
 * GraphQL query resolvers for User-related operations
 * 
 * This resolver class provides queries for retrieving user information:
 * - Current authenticated user details
 * - List of all users in the system
 * - Single user lookup by ID or Firebase UID
 * 
 * @remarks
 * All queries return either UserResponse or UsersResponse types that include:
 * - success: boolean indicating operation success
 * - user/users: the requested user data
 * - errors: array of validation or operation errors
 * 
 * @example
 * ```graphql
 * query {
 *   users {
 *     success
 *     users {
 *       id
 *       email
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
@Service()
@Resolver(User)
@UseMiddleware(LogOperationMiddleware)
export class UserQueries {
  constructor(private usersService: UsersService) {}

  /**
   * Query to get the current authenticated user's information
   * 
   * This query requires authentication and returns the profile of the currently
   * logged-in user. It uses the Firebase UID from the authentication context to
   * identify the user.
   * 
   * @param ctx - Authentication context containing user information
   * @returns UserResponse with the current user's data or error details
   * @throws {ValidationError} If the user is not found in the database
   * 
   * @example
   * ```graphql
   * query {
   *   me {
   *     success
   *     user {
   *       id
   *       email
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
  @Query(() => UserResponse)
  @UseMiddleware(authMiddleware)
  async me(@Ctx() ctx: AuthContext): Promise<UserResponse> {
    try {
      const user = await this.usersService.findByFirebaseUid(ctx.user.uid);
      
      if (!user) {
        logger.warn('Current user not found in database', { 
          firebaseUid: ctx.user.uid 
        });
        return {
          success: false,
          errors: [{
            field: 'auth',
            message: 'Current user not found'
          }]
        };
      }

      return { success: true, user };
    } catch (error: any) {
      logger.error('Failed to fetch current user', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch current user'
        }]
      };
    }
  }

  /**
   * Query to fetch all users in the system
   * 
   * This query retrieves a list of all users in the database.
   * Consider implementing pagination for large datasets.
   * 
   * @returns UsersResponse containing array of all users or error details
   * @throws {PrismaError} If database query fails
   * 
   * @example
   * ```graphql
   * query {
   *   users {
   *     success
   *     users {
   *       id
   *       email
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
  @Query(() => UsersResponse)
  async users(): Promise<UsersResponse> {
    try {
      const users = await this.usersService.findAll();
      return {
        success: true,
        users
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch users'
        }]
      };
    }
  }

  /**
   * Query to fetch a single user by ID or Firebase UID
   * 
   * This query allows looking up a user using either their database ID
   * or their Firebase UID. At least one identifier must be provided.
   * 
   * @param id - Optional database ID of the user
   * @param firebase_uid - Optional Firebase UID of the user
   * @returns UserResponse containing the found user or error details
   * @throws {ValidationError} If neither ID nor Firebase UID is provided
   * @throws {NotFoundError} If user is not found
   * 
   * @example
   * ```graphql
   * query {
   *   user(id: 1) {
   *     success
   *     user {
   *       email
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
  @Query(() => UserResponse)
  async user(
    @Arg('id', () => Int, { nullable: true }) id?: number,
    @Arg('firebase_uid', () => String, { nullable: true }) firebase_uid?: string
  ): Promise<UserResponse> {
    try {
      let user;
      
      if (id) {
        user = await this.usersService.findById(id);
      } else if (firebase_uid) {
        user = await this.usersService.findByFirebaseUid(firebase_uid);
      } else {
        return {
          success: false,
          errors: [{
            field: 'query',
            message: 'Either id or firebase_uid must be provided'
          }]
        };
      }

      if (!user) {
        const identifier = id ? `ID ${id}` : `Firebase UID ${firebase_uid}`;
        logger.warn('User not found', { userId: id, firebaseUid: firebase_uid });
        return {
          success: false,
          errors: [{
            field: id ? 'id' : 'firebase_uid',
            message: `User with ${identifier} not found`
          }]
        };
      }

      return { success: true, user };
    } catch (error: any) {
      logger.error('Failed to fetch user', {
        userId: id,
        firebaseUid: firebase_uid,
        error: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta
      });

      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch user'
        }]
      };
    }
  }
} 