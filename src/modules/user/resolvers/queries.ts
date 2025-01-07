import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { User, UserResponse, UsersResponse } from '../schema/types';
import { UsersService } from '../../../services/userService';
import { LogOperationMiddleware } from '../../common/middleware/loggerMiddleware';
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
  async user(@Arg('id', () => Int) id: number): Promise<UserResponse> {
    try {
      const user = await this.usersService.findById(id);
      if (!user) {
        logger.warn('User not found', { userId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `User with ID ${id} not found`
          }]
        };
      }

      logger.info('Successfully fetched user', { 
        userId: user.id,
        email: user.email 
      });

      return { success: true, user };
    } catch (error: any) {
      logger.error('Failed to fetch user', {
        userId: id,
        error: error.message,
        stack: error.stack,
        code: error.code,  // Prisma error code
        meta: error.meta   // Prisma metadata
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