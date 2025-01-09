import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { User, UserResponse, UsersResponse } from '../schema/userTypes';
import { UsersService } from '../../../services/userService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
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