import { Resolver, Query, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Chat, ChatResponse, ChatsResponse } from '../schema/chatTypes';
import { ChatMember, ChatMemberResponse, ChatMembersResponse } from '../schema/chatTypes';
import { Message, MessageResponse, MessagesResponse } from '../schema/chatTypes';
import { ChatsService, ChatMembersService, MessagesService } from '../../../services/chatService';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';

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
   * query { chats { 
   *    success 
   *    chats { 
   *        id 
   *        type
   *        title
   *        password 
   *        profile_pic
   *        creator { 
   *            first_name 
   *            last_name 
   *            email 
   *        } 
   *        creator_id 
   *        created_at 
   *        updated_at 
   *    } 
   *    errors { 
   *        field 
   *        message 
   *    } 
   * }}
   * ```
   */
  @Query(() => ChatsResponse)
  async chats(): Promise<ChatsResponse> {
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
   * query { chat(id: 1) {
   *    success 
   *    chats { 
   *        id 
   *        type
   *        title 
   *        password
   *        profile_pic
   *        creator {
   *            first_name 
   *            last_name 
   *            email 
   *        } 
   *        creator_id 
   *        created_at 
   *        updated_at 
   *    } 
   *    errors { 
   *        field 
   *        message 
   *    }
   * }}
   * ```
   */
  @Query(() => ChatResponse)
  async chat(@Arg('id', () => Int) id: number): Promise<ChatResponse> {
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
   * query { chatMembers(id: 1) {
   *    success 
   *    chat_members { 
   *        user { 
   *            first_name 
   *            last_name 
   *        } 
   *        user_id 
   *        role 
   *        status 
   *    }
   *    errors { 
   *        field 
   *        message 
   *    } 
   * }}
   * 
   * ```
   */
  @Query(() => ChatMembersResponse)
  async chatMembers(@Arg('id', () => Int) id: number): Promise<ChatMembersResponse> {
    try {
      const chat_members = await this.chatMembersService.findById(id);
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
   * query { chatMembers(id: 1) {
   *    success 
   *    chat_members { 
   *        user { 
   *            first_name 
   *            last_name 
   *        } 
   *        user_id 
   *        role 
   *        status 
   *    }
   *    errors { 
   *        field 
   *        message 
   *    } 
   * }}
   * 
   * ```
   */
  @Query(() => ChatMembersResponse)
  async userChats(@Arg('id', () => Int) id: number): Promise<ChatMembersResponse> {
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
   * query { chatMembers(id: 1) {
   *    success 
   *    chat_members { 
   *        user { 
   *            first_name 
   *            last_name 
   *        } 
   *        user_id 
   *        role 
   *        status 
   *    }
   *    errors { 
   *        field 
   *        message 
   *    } 
   * }}
   * 
   * ```
   */
  @Query(() => MessagesResponse)
  async Messages(@Arg('id', () => Int) id: number): Promise<MessagesResponse> {
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
}