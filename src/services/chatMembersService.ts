import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { ChatMember, Message, UserChatPreview  } from '../modules/chat/schema/chatTypes';
import { NotFoundError } from '../modules/common/errors/graphql.error';
import { MessageStatus, UserSortType } from '../modules/common/types/enumTypes';
import { usersSortingConfig } from '../modules/common/types/sortingTypes';
import { CreateChatMemberInput, UpdateChatMemberInput } from '../modules/chat/schema/chatInputs';
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
  async findById(
    id: number,
    sort_by?: UserSortType
  ): Promise<ChatMember[] | null> {
    const orderBy = sort_by ? usersSortingConfig[sort_by] : undefined;

    return await this.prisma.chatMember.findMany({
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
          user: {
            include: {point: true}
          }
        },
        orderBy: {user: orderBy}
    });
  }

  /**
   * Find all chats of a user given user ID
   * 
   * @param id - The unique identifier of the user
   * @param sortType - UserSortType
   * @returns Promise resolving to the chat/user relations if found, null otherwise
   * @throws {PrismaError} If database query fails
   */
  async findByUserId(
    id: number
  ): Promise<ChatMember[] | null> {
    return await this.prisma.chatMember.findMany({
        where: { 
            user_id: id
        },
        include: {
          chat: {
            include: {
              creator: {
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
                  creator: {
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
              creator: {
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

  async findUserChatPreviews(userId: number): Promise<UserChatPreview[]> {
    const memberships = await this.prisma.chatMember.findMany({
      where: { user_id: userId },
      include: {
        chat: {
          include: {
            creator: { include: { point: true } },
          },
        },
        user: {
          include: {point: true}
        },
      },
    });

    if (!memberships.length) {
      return [];
    }

    const chatIds = memberships.map((m: ChatMember) => m.chat_id);

    const lastMessages = await Promise.all(
      chatIds.map((chatId: number) =>
        this.prisma.message.findFirst({
          where: { chat_id: chatId },
          orderBy: { created_at: 'desc' },
          include: {
            chat: { include: { creator: { include: { point: true } } } },
            sender: { include: { point: true } },
            post: {
              include: {
                author: { include: { point: true } },
                post_targets: true,
                post_views: true,
              },
            },
          },
        })
      )
    );

    const lastMessageByChat = new Map<number, Message>();
    lastMessages.forEach((message) => {
      if (message) lastMessageByChat.set(message.chat_id, message);
    });

    const unreadReceipts = await this.prisma.messageReceipt.findMany({
      where: {
        recipient_id: userId,
        status: { not: MessageStatus.READ },
        message: { chat_id: { in: chatIds } },
      },
      select: { message_id: true, message: { select: { chat_id: true } } },
    });

    console.log("😒 findUserChatPreviews unreadReceipts", unreadReceipts);

    const unreadByChat = new Map<number, number>();
    unreadReceipts.forEach((receipt: any) => {
      const chatId = receipt.message.chat_id;
      unreadByChat.set(chatId, (unreadByChat.get(chatId) ?? 0) + 1);
    });

    return memberships.map((member: any) => ({
      chat: member.chat,
      role: member.role,
      status: member.status,
      lastMessage: lastMessageByChat.get(member.chat_id) ?? null,
      unreadCount: unreadByChat.get(member.chat_id) ?? 0,
      lastReadMessageId: member.last_read_message_id ?? null,
      lastReadAt: member.last_read_at ?? null,
    }));
  }
}