import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Friendship } from '../modules/friendship/schema/friendshipTypes';
import { CreateFriendshipInput, UpdateFriendshipInput } from '../modules/friendship';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import { UserSortType } from '../modules/common/types/enumTypes';
import { usersSortingConfig } from '../modules/common/types/sortingTypes';

/**
 * Service handling friendship-related business logic
 * 
 * This service provides methods for managing friendship relations in the system,
 * including CRUD operations and friendship-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class FriendshipsService {
  constructor(private prisma: PrismaClient) {}
  /**
   * Find all friends of a user
   * 
   * @param id - The unique identifier of the user
   * @returns Promise resolving to the friendships if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async getFriends(
    id: number,
    sort_by?: UserSortType
  ): Promise<Friendship[] | null> {
    const orderBy = sort_by ? usersSortingConfig[sort_by] : undefined;
    return await this.prisma.friendship.findMany({
        where: { 
          user_id: id,
          //status: "ACCEPTED"
        },
        include: {
          user: {
            include: {point: true}
          },
          friend: {
            include: {point: true}
          },
          chat: {
            include: {creator: {
              include: {point: true}
            }}
          }
        },
        orderBy: {friend: orderBy}
    });
  }

  /**
   * Find all friend requests of the user
   * 
   * @param id - The unique identifier of the user
   * @returns Promise resolving to the friend requests if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async getFriendRequests(id: number, user_role: string): Promise<Friendship[] | null> {
    return await this.prisma.friendship.findMany({
        where: { 
            user_id: id,
            role: user_role,
            status: "PENDING"
        },
        include: {
          user: {
            include: {point: true}
          },
          friend: {
            include: {point: true}
          },
          chat: {
            include: {creator: {
              include: {point: true}
            }}
          }
        }
    });
  }

  /**
   * Add a friendship i.e. send a friend request
   * 
   * @param input - Friendship creation data
   * @returns Promise resolving to the created friend request
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateFriendshipInput): Promise<Friendship> {
    try {
      const friendship_sent = await this.prisma.friendship.create({
        data: {
          user_id: input.sender_id,
          friend_id: input.receiver_id,
          role: "sender"
        },
        include: {
          user: {
            include: {point: true}
          },
          friend: {
            include: {point: true}
          },
          chat: {
            include: {creator: {
              include: {point: true}
            }}
          }
        }
      });
      const friendship_received = await this.prisma.friendship.create({
        data: {
          user_id: input.receiver_id,
          friend_id: input.sender_id,
          role: "receiver"
        },
        include: {
          user: {
            include: {point: true}
          },
          friend: {
            include: {point: true}
          },
          chat: {
            include: {creator: true}
          }
        }
      });
      return friendship_sent
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error(`Friend relation already exists`);
      }
      if (error.code === 'P2003') {
        throw new NotFoundError(`Foreign key constraint violated: either user ${input.sender_id} or user ${input.receiver_id} cannot be found`);
      }
      throw error;
    }
  }

  /**
   * Create a direct chat between two users (that already have friend relation)
   * 
   * @param user_id_1 - id of first user
   * @param user_id_2 - id of second user
   * @param input - Updated friendship
   * @returns Promise resolving to the updated friendship
   * @throws {NotFoundError} If community doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async createChat(
    user_id_1: number, 
    user_id_2: number
  ): Promise<Friendship> {
    try {
      const new_chat = await this.prisma.chat.create({
        data: {
          type: "direct"
        }
      });
      // add both members to chat
      let chat_user_1 = await this.prisma.chatMember.create({
        data: {
          chat_id: new_chat.id,
          user_id: user_id_1,
          role: "USER",
          status: "ACCEPTED",
        }
      });
      let chat_user_2 = await this.prisma.chatMember.create({
        data: {
          chat_id: new_chat.id,
          user_id: user_id_2,
          role: "USER",
          status: "ACCEPTED",
        }
      });
      // add chat id to friendship models
      const friendship_user_1 = await this.prisma.friendship.update({
        where: { 
          user_id_friend_id: {
            user_id: user_id_1,
            friend_id: user_id_2
          }
        },
        data: {
          chat_id: new_chat.id
        },
        include: {
          user: {
            include: {point: true}
          },
          friend: {
            include: {point: true}
          },
          chat: {
            include: {creator: {
              include: {point: true}
            }}
          }
        }
      });
      const friendship_user_2 = await this.prisma.friendship.update({
        where: { 
          user_id_friend_id: {
            user_id: user_id_2,
            friend_id: user_id_1
          }
        },
        data: {
          chat_id: new_chat.id
        },
        include: {
          user: {
            include: {point: true}
          },
          friend: {
            include: {point: true}
          },
          chat: {
            include: {creator: {
              include: {point: true}
            }}
          }
        }
      });
      return friendship_user_1
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Relation not found`);
      }
      throw error;
    }
  }

  /**
   * Update status of a friendship e.g. accept a request
   * can only update pending request that you received
   * 
   * @param user_id - id of sender
   * @param friend_id - id of receiver
   * @param input - Updated friendship
   * @returns Promise resolving to the updated friendship
   * @throws {NotFoundError} If community doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(user_id: number, friend_id: number, input: UpdateFriendshipInput): Promise<Friendship> {
    try {
      let friendship_user = await this.prisma.friendship.update({
        where: { 
          user_id_friend_id: {
            user_id: user_id,
            friend_id: friend_id
          },
          role: "receiver",
          status: "PENDING"
        },
        data: input,
        include: {
          user: {
            include: {point: true}
          },
          friend: {
            include: {point: true}
          },
          chat: {
            include: {creator: {
              include: {point: true}
            }}
          }
        }
      });
      let friendship_friend = await this.prisma.friendship.update({
        where: { 
          user_id_friend_id: {
            user_id: friend_id,
            friend_id: user_id
          },
          role: "sender",
          status: "PENDING"
        },
        data: input,
        include: {
          user: {
            include: {point: true}
          },
          friend: {
            include: {point: true}
          },
          chat: {
            include: {creator: {
              include: {point: true}
            }}
          }
        }
      });
      // make new direct chat if friend request accepted
      if (input.status == "ACCEPTED") {
        return await this.createChat(user_id, friend_id);
      };
      return friendship_user
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Relation not found`);
      }
      throw error;
    }
  }

  /**
   * Remove a friendship
   * 
   * @param user_id - ID of the user
   * @param friend_id - ID of the friend
   * @throws {NotFoundError} If friendship doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(user_id: number, friend_id: number): Promise<void> {
    try {
      let friendship_user = await this.prisma.friendship.findUnique({
        where: { user_id_friend_id: {
          user_id: user_id,
          friend_id: friend_id
        } },
      });
      // delete chat
      if (friendship_user && friendship_user.chat_id) {
        await this.prisma.chat.delete({
          where: {
            id: friendship_user.chat_id
          }
        });
      }
      // delete friendships
      await this.prisma.friendship.delete({
        where: { user_id_friend_id: {
          user_id: user_id,
          friend_id: friend_id
        } },
      });
      await this.prisma.friendship.delete({
        where: { user_id_friend_id: {
          user_id: friend_id,
          friend_id: user_id
        } },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Friend relation between user ${user_id} and user ${friend_id} not found`);
      }
      throw error;
    }
  }
} 