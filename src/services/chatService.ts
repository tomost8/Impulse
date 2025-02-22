import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Chat, ChatMember, Message } from '../modules/chat/schema/chatTypes';
import { CreateChatInput, CreateChatMemberInput, CreateMessageInput } from '../modules/chat/schema/chatInputs';
import { UpdateChatInput, UpdateChatMemberInput } from '../modules/chat/schema/chatInputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import { Role, RequestStatus, UserSortType } from '../modules/common/types/enumTypes';
import { usersSortingConfig } from '../modules/common/types/sortingTypes';


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
        include: { 
          creator: {
            include: {point: true}
          } 
        } 
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
        include: { 
          creator: {
            include: {point: true}
          } 
        } 
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
            include: { 
              creator: {
                include: {point: true}
              } 
            },
        });
        let creator_relation = await this.prisma.chatMember.create({
          data: {
            chat_id: chat.id,
            user_id: input.creator_id,
            role: Role.ADMIN,
            status: RequestStatus.ACCEPTED,
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
        include: { 
          creator: {
            include: {point: true}
          } 
        },
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



