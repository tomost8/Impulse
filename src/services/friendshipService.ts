import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Friendship } from '../modules/friendship/schema/friendshipTypes';
import { CreateFriendshipInput, UpdateFriendshipInput } from '../modules/friendship';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import { RequestStatus } from '../modules/common/types/enumTypes';
import { CreateChatInput } from '../modules/chat';


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
  async getFriends(id: number): Promise<Friendship[] | null> {
    return await this.prisma.friendship.findMany({
        where: { 
          OR : [
            {sender_id: id},
            {receiver_id: id}
          ],
          status: "ACCEPTED"
        },
        include: {
          sender: true,
          receiver: true
        }
    });
  }

  /**
   * Find all friend requests of the user
   * 
   * @param id - The unique identifier of the user
   * @returns Promise resolving to the friend requests if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async getFriendRequests(id: number): Promise<Friendship[] | null> {
    return await this.prisma.friendship.findMany({
        where: { 
            receiver_id: id,
            status: "PENDING"
        },
        include: {
          sender: true,
          receiver: true
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
      let reverse_relation = await this.prisma.friendship.findUnique({
        where: { sender_id_receiver_id: {
          sender_id: input.receiver_id,
          receiver_id: input.sender_id
        } },
      });
      if (reverse_relation) {
        throw new Error(`Friend (reverse) relation already exists`);
      };
      return await this.prisma.friendship.create({
        data: input,
        include: {
          sender: true,
          receiver: true
        }
      });
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
   * Update status of a friendship e.g. accept a request
   * 
   * @param sender_id - id of sender
   * @param receiver_id - id of receiver
   * @param input - Updated friendship
   * @returns Promise resolving to the updated friendship
   * @throws {NotFoundError} If community doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(sender_id: number, receiver_id: number, input: UpdateFriendshipInput): Promise<Friendship> {
    try {
      let new_friendship = await this.prisma.friendship.update({
        where: { 
            sender_id_receiver_id: {
                sender_id: sender_id,
                receiver_id: receiver_id
            }
        },
        data: input,
        include: {
          sender: true,
          receiver: true
        }
      });
      if (input.status == "ACCEPTED") {
        let new_chat = await this.prisma.chat.create({
          data: {
            type: "direct",
            creator_id: sender_id
          }
        });
        let chat_sender = await this.prisma.chatMember.create({
          data: {
            chat_id: new_chat.id,
            user_id: sender_id,
            role: "USER",
            status: "ACCEPTED",
          }
        });
        let chat_receiver = await this.prisma.chatMember.create({
          data: {
            chat_id: new_chat.id,
            user_id: receiver_id,
            role: "USER",
            status: "ACCEPTED",
          }
        });
      }
      return new_friendship
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
   * @param community_id - ID of the sender
   * @param user_id - ID of the user
   * @throws {NotFoundError} If friendship doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(user_id: number, friend_id: number): Promise<void> {
    try {
      let user_is_sender = await this.prisma.friendship.findUnique({
        where: { sender_id_receiver_id: {
          sender_id: user_id,
          receiver_id: friend_id
        } },
      });
      if (user_is_sender) {
        console.log("user is sender");
        /*have to delete chat if it exists
        await this.prisma.chat.delete({
          data: {
            type: "direct",
            creator_id: user_id
          }
        });
        */
        await this.prisma.friendship.delete({
          where: { sender_id_receiver_id: {
            sender_id: user_id,
            receiver_id: friend_id
          } },
        });
      } else {
        console.log("user is receiver");
        /* delete chat */
        await this.prisma.friendship.delete({
          where: { sender_id_receiver_id: {
            sender_id: friend_id,
            receiver_id: user_id
          } },
        });
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Friend relation between user ${user_id} and user ${friend_id} not found`);
      }
      throw error;
    }
  }
} 