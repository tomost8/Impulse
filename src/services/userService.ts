import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { User } from '../modules/user/schema/userTypes';
import { CreateUserInput, UpdateUserInput } from '../modules/user/schema/userInputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';

/**
 * Service handling user-related business logic
 * 
 * This service provides methods for managing users in the system,
 * including CRUD operations and user-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class UsersService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Retrieve all users from the database
   * 
   * @returns Promise resolving to an array of users
   * @throws {PrismaError} If database query fails
   */
  async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  /**
   * Find a user by their ID
   * 
   * @param id - The unique identifier of the user
   * @returns Promise resolving to the user if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user by their Firebase UID
   * 
   * @param firebaseUid - The unique identifier of the user
   * @returns Promise resolving to the user if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { firebase_uid: firebaseUid },
    });
  }

  /**
   * Create a new user
   * 
   * @param input - User creation data
   * @returns Promise resolving to the created user
   * @throws {ValidationError} If user with email already exists
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateUserInput): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: input,
      });
    } catch (error: any) {
      // Transform known error cases
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
   * @throws {NotFoundError} If user doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(id: number, input: UpdateUserInput): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: input,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      throw error;
    }
  }


  /**
   * Update a user by their Firebase UID
   * 
   * @param firebaseUid - Firebase UID of the user
   * @param input - Updated user data
   * @returns Promise resolving to the updated user
   * @throws {NotFoundError} If user doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async updateByFirebaseUid(firebaseUid: string, input: UpdateUserInput): Promise<User> {
    const user = await this.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new NotFoundError(`User with Firebase UID ${firebaseUid} not found`);
    }
    return await this.update(user.id, {
      ...input,
    });
  }

  /**
   * Delete a user from the system
   * 
   * @param id - ID of the user to delete
   * @throws {NotFoundError} If user doesn't exist
   * @throws {PrismaError} If database operation fails
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
