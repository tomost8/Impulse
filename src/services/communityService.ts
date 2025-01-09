import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Community, CommunityMember } from '../modules/community/schema/types';
import { CreateCommunityInput, UpdateCommunityInput } from '../modules/community/schema/inputs';
import { CreateCommunityMemberInput, UpdateCommunityMemberInput } from '../modules/community/schema/inputs';
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




/**
 * Service handling Community/Member-related business logic
 * 
 * This service provides methods for managing Community/Member relations in the system,
 * including CRUD operations and Community/Member-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class CommunityMembersService {
  constructor(private prisma: PrismaClient) {}
  /**
   * Find all members of a community given community ID
   * 
   * @param id - The unique identifier of the community
   * @returns Promise resolving to the community members if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findById(id: number): Promise<CommunityMember[] | null> {
    return await this.prisma.communityMembers.findMany({
        where: { 
            community_id: id
        },
        include: {
          community: {
            include: {
              influencer: true
            }
          },
          user: true
        }
    });
  }

  /**
   * Add a user to a community
   * 
   * @param input - Community/Member creation data
   * @returns Promise resolving to the created Community/Member relation
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateCommunityMemberInput): Promise<CommunityMember> {
    try {
        return await this.prisma.communityMembers.create({
            data: input,
            include: {
              community: {
                include: {
                  influencer: true
                }
              },
              user: true
            }
        });
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Update role/status of a community member
   * 
   * @param community_id - ID of the community
   * @param user_id - ID of the user
   * @param input - Updated community data
   * @returns Promise resolving to the updated community
   * @throws {NotFoundError} If community doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(community_id: number, user_id: number, input: UpdateCommunityMemberInput): Promise<CommunityMember> {
    try {
      return await this.prisma.communityMembers.update({
        where: { 
            community_id_user_id: {
                community_id: community_id,
                user_id: user_id,
            }
        },
        data: input,
        include: {
          community: {
            include: {
              influencer: true
            }
          },
          user: true
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Community with ID ${community_id} not found`);
      }
      throw error;
    }
  }

  /**
   * Remove a user from a community
   * 
   * @param community_id - ID of the community
   * @param user_id - ID of the user
   * @throws {NotFoundError} If Community/Member relation doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(community_id: number, user_id: number): Promise<void> {
    try {
        await this.prisma.communityMembers.delete({
            where: { community_id_user_id: {
                community_id: community_id,
                user_id: user_id,
            } },
        });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Community with ID ${community_id} not found`);
      }
      throw error;
    }
  }
} 