import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { User } from '../modules/user/schema/userTypes';
import { CreateUserInput, UpdateUserInput } from '../modules/user/schema/userInputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import { pubsub } from '../config/pubsub';
import { UserSortType } from '../modules/common/types/enumTypes';
import { usersSortingConfig } from '../modules/common/types/sortingTypes';
import { LoginStreakService } from './loginStreakService';

export const USER_CREATED = 'USER_CREATED';

/**
 * Service handling user-related business logic and database operations
 * 
 * This service provides methods for managing users in the system, including:
 * - CRUD operations for user management
 * - User authentication via Firebase
 * - Points system integration
 * - Real-time user updates via GraphQL subscriptions
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations and implements PubSub for real-time events
 */
@Service()
export class UsersService {
  constructor(
    private prisma: PrismaClient,
    private loginStreakService: LoginStreakService
  ) {}

  /**
   * Retrieve all users from the database
   * 
   * @returns Promise<User[]> Array of all users in the system
   * @throws {PrismaError} If database query fails
   */
  async findAll(sort_by?: UserSortType): Promise<User[]> {
    const orderBy = sort_by ? usersSortingConfig[sort_by] : undefined;
    return await this.prisma.user.findMany({
      include: {
        point: true,
        login_streak: true
      },
      orderBy: orderBy
    });
  }

  /**
   * Find a specific user by their ID
   * 
   * @param id - The unique identifier of the user in the database
   * @returns Promise<User | null> The found user or null if not found
   * @throws {PrismaError} If database query fails
   */
  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        point: true,
        login_streak: true
      }
    });
  }

  /**
   * Find a user by their Firebase UID
   * 
   * @param firebaseUid - The Firebase authentication unique identifier
   * @returns Promise<User | null> The found user or null if not found
   * @throws {PrismaError} If database query fails
   */
  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { firebase_uid: firebaseUid },
      include: {
        point: true,
        login_streak: true
      }
    });

    return user;
  }

  /**
   * Create a new user and initialize their points
   * 
   * @param input - User creation data containing required user information
   * @returns Promise<User> The newly created user
   * @throws {ValidationError} If a user with the same email already exists
   * @throws {PrismaError} If database operations fail
   * @remarks This method also creates an initial points record for the user and triggers a USER_CREATED event
   */
  async create(input: CreateUserInput): Promise<User> {
    try {
      const new_user = await this.prisma.user.create({
        data: {
          ...input,
          point: {
            create: {
              points: 0,
              spending_points: 0,
              weekly_points: 0,
              monthly_points: 0,
              preferences: {},
              status: 'active'
            }
          }
        },
        include: {
          point: true,
          login_streak: true
        }
      });
      await pubsub.publish(USER_CREATED, { userCreated: new_user });
      console.log('Published user created event:', { userCreated: new_user });
      return new_user;
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ValidationError(`User with email ${input.email} already exists`);
      }
      throw error;
    }
  }

  /**
   * Update an existing user's information
   * 
   * @param id - ID of the user to update
   * @param input - Updated user data containing fields to modify
   * @returns Promise<User> The updated user
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(id: number, input: UpdateUserInput): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: input,
        include: {point: true}
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Update a user's information using their Firebase UID
   * 
   * @param firebaseUid - Firebase authentication UID of the user
   * @param input - Updated user data containing fields to modify
   * @returns Promise<User> The updated user
   * @throws {NotFoundError} If the user doesn't exist
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
   * Permanently delete a user from the system
   * 
   * @param id - ID of the user to delete
   * @throws {NotFoundError} If the user doesn't exist
   * @throws {PrismaError} If database operation fails
   * @remarks This operation will cascade delete related records based on the Prisma schema configuration
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
