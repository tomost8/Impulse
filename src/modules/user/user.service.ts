import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { User, CreateUserInput, UpdateUserInput } from './user.schema';
import logger from '../../config/logger';
import { NotFoundError } from '../common/errors/graphql.error';

/**
 * Service handling user-related business logic
 * 
 * This service provides methods for managing users in the system,
 * including CRUD operations and user-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 * 
 * @example
 * ```typescript
 * const userService = Container.get(UserService);
 * 
 * // Create a new user
 * const newUser = await userService.create({
 *   email: "john@example.com",
 *   name: "John Doe"
 * });
 * ```
 */
@Service()
export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Retrieve all users from the database
   * 
   * @returns Promise resolving to an array of users
   * @throws {PrismaError} If database query fails
   * 
   * @example
   * ```typescript
   * const users = await userService.findAll();
   * users.forEach(user => console.log(user.email));
   * ```
   */
  async findAll(): Promise<User[]> {
    try {
      logger.debug('Fetching all users');
      const users = await this.prisma.user.findMany();
      logger.info('Successfully fetched all users', { count: users.length });
      return users;
    } catch (error: any) {
      logger.error('Failed to fetch users', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find a user by their ID
   * 
   * @param id - The unique identifier of the user
   * @returns Promise resolving to the user if found, null otherwise
   * @throws {PrismaError} If database query fails
   * 
   * @example
   * ```typescript
   * const user = await userService.findById(1);
   * if (user) {
   *   console.log(`Found user: ${user.name}`);
   * }
   * ```
   */
  async findById(id: number): Promise<User | null> {
    try {
      logger.debug('Finding user by ID', { userId: id });
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      
      if (user) {
        logger.info('Successfully found user', { userId: id });
      } else {
        logger.warn('User not found', { userId: id });
      }
      
      return user;
    } catch (error: any) {
      logger.error('Failed to find user', {
        userId: id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create a new user
   * 
   * @param input - User creation data
   * @returns Promise resolving to the created user
   * @throws {PrismaError} If database operation fails
   * @throws {ValidationError} If input data is invalid
   * 
   * @example
   * ```typescript
   * const newUser = await userService.create({
   *   email: "jane@example.com",
   *   name: "Jane Doe"
   * });
   * console.log(`Created user with ID: ${newUser.id}`);
   * ```
   */
  async create(input: CreateUserInput): Promise<User> {
    try {
      logger.debug('Creating new user', { 
        email: input.email,
        name: input.name 
      });
      
      const user = await this.prisma.user.create({
        data: input,
      });
      
      logger.info('Successfully created user', { 
        userId: user.id,
        email: user.email 
      });
      
      return user;
    } catch (error: any) {
      logger.error('Failed to create user', {
        input: { email: input.email, name: input.name },
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update an existing user
   * 
   * @param id - ID of the user to update
   * @param input - Updated user data
   * @returns Promise resolving to the updated user
   * @throws {PrismaError} If database operation fails
   * @throws {NotFoundError} If user doesn't exist
   * 
   * @example
   * ```typescript
   * const updatedUser = await userService.update(1, {
   *   name: "Jane Smith"
   * });
   * console.log(`Updated user name: ${updatedUser.name}`);
   * ```
   */
  async update(id: number, input: UpdateUserInput): Promise<User> {
    try {
      logger.debug('Updating user', { 
        userId: id,
        updates: input 
      });

      const user = await this.prisma.user.update({
        where: { id },
        data: input,
      });
      
      logger.info('Successfully updated user', { 
        userId: id,
        updates: input 
      });
      
      return user;
    } catch (error: any) {
      logger.error('Failed to update user', {
        userId: id,
        updates: input,
        error: error.message,
        stack: error.stack
      });
      
      if (error.code === 'P2025') {
        const notFoundError = new NotFoundError(`User with ID ${id} not found`);
        logger.warn('User not found during update', { userId: id });
        throw notFoundError;
      }
      
      throw error;
    }
  }

  /**
   * Delete a user from the system
   * 
   * @param id - ID of the user to delete
   * @throws {PrismaError} If database operation fails
   * @throws {NotFoundError} If user doesn't exist
   * 
   * @example
   * ```typescript
   * await userService.delete(1);
   * console.log('User deleted successfully');
   * ```
   */
  async delete(id: number): Promise<void> {
    try {
      logger.debug('Deleting user', { userId: id });
      
      await this.prisma.user.delete({
        where: { id },
      });
      
      logger.info('Successfully deleted user', { userId: id });
    } catch (error: any) {
      logger.error('Failed to delete user', {
        userId: id,
        error: error.message,
        stack: error.stack
      });
      
      if (error.code === 'P2025') {
        const notFoundError = new NotFoundError(`User with ID ${id} not found`);
        logger.warn('User not found during deletion', { userId: id });
        throw notFoundError;
      }
      
      throw error;
    }
  }
} 