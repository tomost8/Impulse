import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { ChatMember, Message } from '../modules/chat/schema/chatTypes';
import { CreateMessageInput } from '../modules/chat/schema/chatInputs';
import { pubsub, CHAT_MESSAGE_SENT } from '../config/pubsub';
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
      const message = await this.prisma.message.create({
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

      const members = await this.prisma.chatMember.findMany({
        where: { chat_id: input.chat_id },
        select: { user_id: true },
      });

      const receiptData = members
        .filter((member: any) => member.user_id !== input.sender_id)
        .map((member: any) => ({
          message_id: message.id,
          recipient_id: member.user_id,
        }));

      if (receiptData.length) {
        await this.prisma.messageReceipt.createMany({ data: receiptData });
      }

      await pubsub.publish(CHAT_MESSAGE_SENT, { messageSent: message });
      return message;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get the most recent message from each chat the user is a member of
   * @param userId - The user's ID
   * @returns Promise resolving to an array of the latest messages for each chat
   */
  async getLatestMessagesForUser(userId: number): Promise<Message[]> {
    const chatMemberships = await this.prisma.chatMember.findMany({
      where: { user_id: userId },
      select: { chat_id: true }
    });

    console.log("getLatestMessagesForUser chatMemberships", chatMemberships)

    const chatIds = chatMemberships.map((cm: { chat_id: number }) => cm.chat_id);
    if (chatIds.length === 0) return [];

    const latestMessages: (Message | null)[] = await Promise.all(
      chatIds.map(async (chat_id: number) => {
        return this.prisma.message.findFirst({
          where: { chat_id },
          orderBy: { created_at: 'desc' },
          include: {
            chat: {
              include: {
                creator: {
                  include: { point: true }
                }
              }
            },
            sender: {
              include: { point: true }
            },
            post: {
              include: {
                author: {
                  include: { point: true }
                },
                post_targets: true,
                post_views: true,
              }
            }
          },
        });
      })
    );

    // Remove nulls, and explicitly tell TS that now it's Message[]
    return latestMessages.filter((msg): msg is Message => msg !== null);
  }

  async getMessagesAfter(
    chatId: number,
    options: { after?: Date; afterMessageId?: number; limit?: number }
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const { after, afterMessageId, limit = 50 } = options;
    const where: any = { chat_id: chatId };

    if (after) where.created_at = { gt: after };
    if (afterMessageId) where.id = { gt: afterMessageId };

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { created_at: 'asc' },
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
      },
      take: limit + 1,
    });
    const hasMore = messages.length > limit;
    return {
      messages: hasMore ? messages.slice(0, limit) : messages,
      hasMore,
    };
  }
}