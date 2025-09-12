import { Resolver, Query, Arg, Int, UseMiddleware, FieldResolver, Root } from 'type-graphql';
import { Service } from 'typedi';
import { Chat, ChatResponse, ChatsResponse } from '../schema/chatTypes';
import { ChatMember, ChatMemberResponse, ChatMembersResponse } from '../schema/chatTypes';
import { Message, MessageResponse, MessagesResponse } from '../schema/chatTypes';
import { ChatsService } from '../../../services/chatService';
import { ChatMembersService } from '../../../services/chatMembersService';
import { MessagesService } from '../../../services/messageService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';
import { UserSortType } from '../../common/types/enumTypes';

/**
 * GraphQL query resolvers for Chat-related operations
 */
@Service()
@Resolver(Chat)
@UseMiddleware(LogOperationMiddleware)
export class ChatQueries {
  constructor(private chatsService: ChatsService) {}

  /**
   * Query to fetch all chats
   * 
   * @returns Response containing array of all chats in the system
   * 
   * @example
   * ```graphql
   * query { getAllChats 
   * { success chats { 
   * id type title password profile_pic creator { id first_name last_name email } created_at updated_at
   * } errors { field message } } }
   * ```
   */
  @Query(() => ChatsResponse)
  async getAllChats(): Promise<ChatsResponse> {
    try {
      const chats = await this.chatsService.findAll();
      return {
        success: true,
        chats
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch chats'
        }]
      };
    }
  }

  /**
   * Query to fetch a single chat by ID
   * 
   * @param id - The ID of the chat to fetch
   * @returns Response containing the chat if found
   * 
   * @example
   * ```graphql
   * query { getChat(
   * id: 1
   * ) { success chat { 
   * id type title password profile_pic creator { id first_name last_name email } created_at updated_at
   * errors { field message } } }
   * ```
   */
  @Query(() => ChatResponse)
  async getChat(@Arg('id', () => Int) id: number): Promise<ChatResponse> {
    try {
      const chat = await this.chatsService.findById(id);
      if (!chat) {
        logger.warn('Chat not found', { chatId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `Chat with ID ${id} not found`
          }]
        };
      }

      logger.info('Successfully fetched chat', { 
        chatId: chat.id
      });

      return { success: true, chat };
    } catch (error: any) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch chat'
        }]
      };
    }
  }
} 




/**
 * GraphQL query resolvers for Chat/Member-related operations
 */
@Service()
@Resolver(ChatMember)
@UseMiddleware(LogOperationMiddleware)
export class ChatMemberQueries {
  constructor(private chatMembersService: ChatMembersService) {}

  /**
   * Query to fetch all members of a chat given chat id
   * 
   * @returns Response containing array of all members of a chat
   * 
   * @example
   * ```graphql
   * query { getChatMembers(
   * id: 1
   * ) { success chat_members { 
   * user { id first_name last_name } role status
   * } errors { field message } } }
   * ```
   */
  @Query(() => ChatMembersResponse)
  async getChatMembers(
    @Arg('id', () => Int) id: number,
    @Arg('sort_by', () => UserSortType, {nullable: true}) sort_by?: UserSortType
  ): Promise<ChatMembersResponse> {
    try {
      const chat_members = await this.chatMembersService.findById(id, sort_by);
      if (!chat_members) {
        logger.warn('Chat not found', { chatId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `Chat with ID ${id} not found`
          }]
        }
      }
      return {
        success: true,
        chat_members
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch chats'
        }]
      };
    }
  }

  /**
   * Query to fetch all members of a chat given chat id
   * 
   * @returns Response containing array of all members of a chat
   * 
   * @example
   * ```graphql
   * query { getUserChats(
   * id: 1
   * ) { success chat_members { 
   * chat { id title } role status
   * } errors { field message } } }
   * ```
   */
  @Query(() => ChatMembersResponse)
  async getUserChats(@Arg('id', () => Int) id: number): Promise<ChatMembersResponse> {
    try {
      const chat_members = await this.chatMembersService.findByUserId(id);
      if (!chat_members) {
        logger.warn('User not found', { userId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `User with ID ${id} not found`
          }]
        }
      }
      return {
        success: true,
        chat_members
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch chats'
        }]
      };
    }
  }
}






/**
 * GraphQL query resolvers for message-related operations
 */
@Service()
@Resolver(Message)
@UseMiddleware(LogOperationMiddleware)
export class MessageQueries {
  constructor(private messagesService: MessagesService) {}

  /**
   * Query to fetch all members of a chat given chat id
   * 
   * @returns Response containing array of all members of a chat
   * 
   * @example
   * ```graphql
   * query { getMessages(
   * id: 1
   * ) { success messages { 
   * id sender { id first_name last_name } content post { id caption } created_at 
   * } errors { field message } } }
   * 
   * ```
   */
  @Query(() => MessagesResponse)
  async getMessages(@Arg('id', () => Int) id: number): Promise<MessagesResponse> {
    try {
      const messages = await this.messagesService.findById(id);
      if (!messages) {
        logger.warn('Chat not found', { chatId: id });
        return {
          success: false,
          errors: [{
            field: 'id',
            message: `Chat with ID ${id} not found`
          }]
        }
      }
      return {
        success: true,
        messages
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to fetch chats'
        }]
      };
    }
  }

  @Query(() => MessagesResponse)
  async getLatestMessagesForUser(
    @Arg('userId', () => Int) userId: number
  ): Promise<MessagesResponse> {
    try {
      const messages = await this.messagesService.getLatestMessagesForUser(userId);
      return { success: true, messages };
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'general', message: error instanceof Error ? error.message : 'Failed to fetch messages' }]
      };
    }
  }

}