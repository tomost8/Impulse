import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { User } from '../modules/user/schema/types';
import { CreateUserInput, UpdateUserInput } from '../modules/user/schema/inputs';
import logger from '../config/logger';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';

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
 * const usersService = Container.get(UsersService);
 * 
 * // Create a new user
 * const newUser = await usersService.create({
 *   email: "john@example.com",
 *   name: "John Doe"
 * });
 * ```
 */
@Service()
export class UsersService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Retrieve all users from the database
   * 
   * @returns Promise resolving to an array of users
   * @throws {PrismaError} If database query fails
   * 
   * @example
   * ```typescript
   * const users = await usersService.findAll();
   * users.forEach(user => console.log(user.email));
   * ```
   */
  async findAll(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany();
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
   * const user = await usersService.findById(1);
   * if (user) {
   *   console.log(`Found user: ${user.name}`);
   * }
   * ```
   */
  async findById(id: number): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      
      return user;
    } catch (error: any) {

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
   * const newUser = await usersService.create({
   *   email: "jane@example.com",
   *   name: "Jane Doe"
   * });
   * console.log(`Created user with ID: ${newUser.id}`);
   * ```
   */
  async create(input: CreateUserInput): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: input,
      });
      
      return user;
    } catch (error: any) {


      // 处理已知的错误情况
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ValidationError(`User with email ${input.email} already exists`);
      }
      
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
   * const updatedUser = await usersService.update(1, {
   *   name: "Jane Smith"
   * });
   * console.log(`Updated user name: ${updatedUser.name}`);
   * ```
   */
  async update(id: number, input: UpdateUserInput): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: input,
      });
      
      return user;
    } catch (error: any) {

      
      if (error.code === 'P2025') {
        throw new NotFoundError(`User with ID ${id} not found`);
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
   * await usersService.delete(1);
   * console.log('User deleted successfully');
   * ```
   */
  async delete(id: number): Promise<void> {
    try {      
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error: any) {

      
      if (error.code === 'P2025') {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      
      throw error;
    }
  }
} 