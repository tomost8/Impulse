import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { Message } from '../modules/chat/schema/chatTypes';
import { CreateMessageInput } from '../modules/chat/schema/chatInputs';
/**
 * Service handling message-related business logic
 * 
 * This service provides methods for managing messages in the system,
 * including CRUD operations and message business logic.
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class MessagesService {
  constructor(private prisma: PrismaClient) {}
  /**
   * Find all messages of a chat given chat ID
   * 
   * @param id - The unique identifier of the chat
   * @returns Promise resolving to the chat messages if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findById(id: number): Promise<Message[] | null> {
    return await this.prisma.message.findMany({
        where: { 
            chat_id: id
        },
        include: {
          chat: {
            include: {
              creator: {
                include: {point: true}
              }
            }
          },
          sender: {
            include: {point: true}
          },
          post: {
            include: {
              author: {
                include: {point: true}
              },
              post_targets: true,
              post_views: true,
            }
          }
        }
    });
  }

  /**
   * Create (send) a message
   * 
   * @param input - message data
   * @returns Promise resolving to the created message
   * @throws {PrismaError} If database operation fails
   */
  async create(input: CreateMessageInput): Promise<Message> {
    try {
        return await this.prisma.message.create({
            data: input,
            include: {
              chat: {
                include: {
                  creator: {
                    include: {point: true}
                  }
                }
              },
              sender: {
                include: {point: true}
              },
              post: {
                include: {
                  author: {
                    include: {point: true}
                  },
                  post_targets: true,
                  post_views: true,
                }
              }
            }
        });
    } catch (error: any) {
      throw error;
    }
  }
} 