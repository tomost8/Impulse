import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Chat, ChatMember } from '../modules/chat/schema/chatTypes';
import { CreateChatInput, UpdateChatInput } from '../modules/chat/schema/chatInputs';
import { CreateChatMemberInput, UpdateChatMemberInput } from '../modules/chat/schema/chatInputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';

/**
 * Service handling chat-related business logic
 * 
 * This service provides methods for managing chats in the system,
 * including CRUD operations and chat-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class ChatsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Retrieve all chats from the database
   * 
   * @returns Promise resolving to an array of chats
   * @throws {PrismaError} If database query fails
   */
  async findAll(): Promise<Chat[]> {
    return await this.prisma.chat.findMany({
        include: { creator: true },
    });
  }

  /**
   * Find a chat by their ID
   * 
   * @param id - The unique identifier of the chat
   * @returns Promise resolving to the chat if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findById(id: number): Promise<Chat | null> {
    return await this.prisma.chat.findUnique({
        where: { id },
        include: { creator: true },
    });
  }

  /**
   * Create a new chat
   * 
   * @param input - Chat creation data
   * @returns Promise resolving to the created chat
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateChatInput): Promise<Chat> {
    try {
        let chat = await this.prisma.chat.create({
            data: input,
            include: { creator: true },
        });
        let creator_relation = await this.prisma.chatMember.create({
          data: {
            chat_id: chat.id,
            user_id: input.creator_id,
            role: "creator",
            status: "active",
          }
        });
        return chat;
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new NotFoundError(`Foreign key constraint violated: user with ID ${input.creator_id} cannot be found`);
      }
      throw error;
    }
  }

  /**
   * Update an existing chat
   * 
   * @param id - ID of the chat to update
   * @param input - Updated chat data
   * @returns Promise resolving to the updated chat
   * @throws {NotFoundError} If chat doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(id: number, input: UpdateChatInput): Promise<Chat> {
    try {
      return await this.prisma.chat.update({
        where: { id },
        data: input,
        include: { creator: true },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Chat with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete a chat from the system
   * 
   * @param id - ID of the chat to delete
   * @throws {NotFoundError} If chat doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(id: number): Promise<void> {
    try {
        await this.prisma.chat.delete({
            where: { id },
        });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Chat with ID ${id} not found`);
      }
      throw error;
    }
  }
} 




/**
 * Service handling Chat member-related business logic
 * 
 * This service provides methods for managing Chat/User relations in the system,
 * including CRUD operations and Chat/User-specific business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class ChatMembersService {
  constructor(private prisma: PrismaClient) {}
  /**
   * Find all members of a chat given chat ID
   * 
   * @param id - The unique identifier of the chat
   * @returns Promise resolving to the chat members if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findById(id: number): Promise<ChatMember[] | null> {
    let chat = await this.prisma.chat.findUnique({
      where: { id }
    });
    if (!chat) {
      return null;
    }
    return await this.prisma.chatMember.findMany({
        where: { 
            chat_id: id
        },
        include: {
          chat: {
            include: {
              creator: true
            }
          },
          user: true
        }
    });
  }

  /**
   * Add a user to a chat
   * 
   * @param input - Chat/Member creation data
   * @returns Promise resolving to the created Chat/Member relation
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateChatMemberInput): Promise<ChatMember> {
    try {
        return await this.prisma.chatMember.create({
            data: input,
            include: {
              chat: {
                include: {
                  creator: true
                }
              },
              user: true
            }
        });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error(`There is alreay relation between user with ID ${input.user_id} and chat with ID ${input.chat_id}`);
      }
      if (error.code === 'P2003') {
        throw new NotFoundError(`Foreign key constraint violated: either chat with ID ${input.chat_id} or user with ID ${input.user_id} cannot be found`);
      }
      throw error;
    }
  }

  /**
   * Update role/status of a chat member
   * 
   * @param chat_id - ID of the chat
   * @param user_id - ID of the user
   * @param input - Updated chat data
   * @returns Promise resolving to the updated chat
   * @throws {NotFoundError} If chat doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(chat_id: number, user_id: number, input: UpdateChatMemberInput): Promise<ChatMember> {
    try {
      return await this.prisma.chatMember.update({
        where: { 
            chat_id_user_id: {
                chat_id: chat_id,
                user_id: user_id,
            }
        },
        data: input,
        include: {
          chat: {
            include: {
              creator: true
            }
          },
          user: true
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Relation between user with ID ${user_id} and chat with ID ${chat_id} not found`);
      }
      throw error;
    }
  }

  /**
   * Remove a user from a chat
   * 
   * @param chat_id - ID of the chat
   * @param user_id - ID of the user
   * @throws {NotFoundError} If Chat/Member relation doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(chat_id: number, user_id: number): Promise<void> {
    try {
        await this.prisma.chatMember.delete({
            where: { chat_id_user_id: {
                chat_id: chat_id,
                user_id: user_id,
            } },
        });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Relation between user with ID ${user_id} and chat with ID ${chat_id} not found`);
      }
      throw error;
    }
  }
} 