import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Community } from '../modules/community/schema/types';
import { CreateCommunityInput, UpdateCommunityInput } from '../modules/community/schema/inputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';

/**
 * Service handling community-related business logic
 * 
 * This service provides methods for managing communities in the system,
 * including CRUD operations and community-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class CommunitiesService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Retrieve all communities from the database
   * 
   * @returns Promise resolving to an array of communities
   * @throws {PrismaError} If database query fails
   */
  async findAll(): Promise<Community[]> {
    return await this.prisma.community.findMany({
        include: { influencer: true },
    });
  }

  /**
   * Find a community by their ID
   * 
   * @param id - The unique identifier of the community
   * @returns Promise resolving to the community if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findById(id: number): Promise<Community | null> {
    return await this.prisma.community.findUnique({
        where: { id },
        include: { influencer: true },
    });
  }

  /**
   * Create a new community
   * 
   * @param input - Community creation data
   * @returns Promise resolving to the created community
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateCommunityInput): Promise<Community> {
    try {
        return await this.prisma.community.create({
            data: input,
            include: { influencer: true },
        });
    } catch (error: any) {
      // Transform known error cases
      //if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      //  throw new ValidationError(`User with email ${input.email} already exists`);
      //}
      throw error;
    }
  }

  /**
   * Update an existing community
   * 
   * @param id - ID of the community to update
   * @param input - Updated community data
   * @returns Promise resolving to the updated community
   * @throws {NotFoundError} If community doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(id: number, input: UpdateCommunityInput): Promise<Community> {
    try {
      return await this.prisma.community.update({
        where: { id },
        data: input,
        include: { influencer: true },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Community with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete a community from the system
   * 
   * @param id - ID of the community to delete
   * @throws {NotFoundError} If community doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(id: number): Promise<void> {
    try {
        await this.prisma.community.delete({
            where: { id },
        });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Community with ID ${id} not found`);
      }
      throw error;
    }
  }
} 