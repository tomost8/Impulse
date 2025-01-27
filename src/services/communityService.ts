import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Community, CommunityMember, CommunityCategory } from '../modules/community/schema/communityTypes';
import { CreateCommunityInput, UpdateCommunityInput } from '../modules/community/schema/communityInputs';
import { CreateCommunityMemberInput, UpdateCommunityMemberInput } from '../modules/community/schema/communityInputs';
import { CreateCommunityCategoryInput } from '../modules/community/schema/communityInputs';
import { Category } from '../modules/common/types/enumTypes';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import { Role, RequestStatus, UserSortType } from '../modules/common/types/enumTypes';
import { usersSortingConfig } from '../modules/common/types/sortingTypes';
import { FriendshipsService } from './friendshipService';

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
        include: { 
          influencer: {
            include: {point: true}
          }
        } 
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
        include: { 
          influencer: {
            include: {point: true}
          }
        } 
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
        let community = await this.prisma.community.create({
            data: input,
            include: { 
              influencer: {
                include: {point: true}
              }
            } 
        });
        let owner_relation = await this.prisma.communityMember.create({
          data: {
            community_id: community.id,
            user_id: input.influencer_id,
            role: Role.ADMIN,
            status: RequestStatus.ACCEPTED,
          }
        });
        return community;
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new NotFoundError(`Foreign key constraint violated: user with ID ${input.influencer_id} cannot be found`);
      }
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
        include: { 
          influencer: {
            include: {point: true}
          }
        } 
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
 * Service handling Community member-related business logic
 * 
 * This service provides methods for managing Community/User relations in the system,
 * including CRUD operations and Community/User-specific business logic.
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
  async findById(
    id: number,
    sort_by?: UserSortType
  ): Promise<CommunityMember[] | null> {
    const orderBy = sort_by ? usersSortingConfig[sort_by] : undefined;

    return await this.prisma.communityMember.findMany({
      where: { 
        community_id: id
      },
      include: {
        community: {
          include: {
            influencer: {
              include: {point: true}
            }
          }
        },
        user: {
          include: {point: true}
        }
      },
      orderBy
    });
  }

  /**
   * Find all communities of a user given user ID
   * 
   * @param id - The unique identifier of the community
   * @returns Promise resolving to the community members if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findByUserId(id: number): Promise<CommunityMember[] | null> {
    return await this.prisma.communityMember.findMany({
        where: { 
            user_id: id
        },
        include: {
          community: {
            include: {
              influencer: {
                include: {point: true}
              }
            }
          },
          user: {
            include: {point: true}
          }
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
      const new_member = await this.prisma.communityMember.create({
        data: input,
        include: {
          community: {
            include: {
              influencer: {
                include: {point: true}
              }
            }
          },
          user: {
            include: {point: true}
          }
        }
      });
      // add friends if not already
      const influencerId = new_member.community.influencer_id;
      const existingFriendship = await this.prisma.friendship.findFirst({
        where: {
          user_id: input.user_id,
          friend_id: influencerId
        }
      });
      // Create friendship if it doesn't exist
      if (!existingFriendship) {
        const friendship_member = await this.prisma.friendship.create({
          data: {
            user_id: input.user_id,
            friend_id: influencerId,
            role: "community member",
            status: "ACCEPTED"
          }
        });
        const friendship_leader = await this.prisma.friendship.create({
          data: {
            user_id: influencerId,
            friend_id: input.user_id,
            role: "community leader",
            status: "ACCEPTED"
          }
        });
        // should probably extract the create direct function to chatService 
        const friendshipService = new FriendshipsService(this.prisma);
        const friendship = await friendshipService.createChat(influencerId, input.user_id);
      }
      return new_member
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error(`There is alreay relation between user with ID ${input.user_id} and community with ID ${input.community_id}`);
      }
      if (error.code === 'P2003') {
        throw new NotFoundError(`Foreign key constraint violated: either community with ID ${input.community_id} or user with ID ${input.user_id} cannot be found`);
      }
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
      return await this.prisma.communityMember.update({
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
              influencer: {
                include: {point: true}
              }
            }
          },
          user: {
            include: {point: true}
          }
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Relation between user with ID ${user_id} and community with ID ${community_id} not found`);
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
        await this.prisma.communityMember.delete({
            where: { community_id_user_id: {
                community_id: community_id,
                user_id: user_id,
            } },
        });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Relation between user with ID ${user_id} and community with ID ${community_id} not found`);
      }
      throw error;
    }
  }
} 





/**
 * Service handling Community/Category-related business logic
 * 
 * This service provides methods for managing Community/Category relations in the system,
 * including CRUD operations and Community/Category-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class CommunityCategoriesService {
  constructor(private prisma: PrismaClient) {}
  /**
   * Find all categories of a community given community ID
   * 
   * @param id - The unique identifier of the community
   * @returns Promise resolving to the community categories if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findById(id: number): Promise<CommunityCategory[] | null> {
    return await this.prisma.communityCategory.findMany({
        where: { 
            community_id: id
        },
        include: {
          community: {
            include: {
              influencer: {
                include: {point: true}
              }
            }
          }
        }
    });
  }

  /**
   * Find all communities of a category given category
   * 
   * @param category - the category type
   * @returns Promise resolving to the community/categories if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findByCategoryId(category: Category): Promise<CommunityCategory[] | null> {
    return await this.prisma.communityCategory.findMany({
        where: { 
            category: category
        },
        include: {
          community: {
            include: {
              influencer: {
                include: {point: true}
              }
            }
          }
        }
    });
  }

  /**
   * Add a category to a community
   * 
   * @param input - Community/Category creation data
   * @returns Promise resolving to the created Community/Category relation
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateCommunityCategoryInput): Promise<CommunityCategory> {
    try {
        return await this.prisma.communityCategory.create({
            data: input,
            include: {
              community: {
                include: {
                  influencer: {
                    include: {point: true}
                  }
                }
              }
            }
        });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error(`There is already category ${input.category} and community with ID ${input.community_id}`);
      }
      if (error.code === 'P2003') {
        throw new NotFoundError(`Foreign key constraint violated: either community with ID ${input.community_id}`);
      }
      throw error;
    }
  }

  /**
   * Remove a category from a community
   * 
   * @param community_id - ID of the community
   * @param category - category to remove
   * @throws {NotFoundError} If Community/Category relation doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(community_id: number, category: Category): Promise<void> {
    try {
        await this.prisma.communityCategory.delete({
            where: { community_id_category: {
                community_id: community_id,
                category: category,
            } },
        });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Relation between category ${category} and community with ID ${community_id} not found`);
      }
      throw error;
    }
  }
} 