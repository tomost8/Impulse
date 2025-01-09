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
   * Query to get the current authenticated user
   * 
   * @returns Response containing the current user's information
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

      logger.info('Successfully fetched current user', { 
        userId: user.id,
        email: user.email
      });

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
   * Query to fetch all users
   * 
   * @returns Response containing array of all users in the system
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
   * Query to fetch a single user by ID
   * 
   * @param id - The ID of the user to fetch
   * @returns Response containing the user if found
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

      logger.info('Successfully fetched user', { 
        userId: user.id,
        email: user.email,
        firebaseUid: user.firebase_uid
      });

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