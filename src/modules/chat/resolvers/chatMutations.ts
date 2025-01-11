import { Resolver, Mutation, Arg, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { Chat, ChatResponse } from '../schema/chatTypes';
import { CreateChatInput, UpdateChatInput } from '../schema/chatInputs';
import { ChatsService } from '../../../services/chatService';
import { ChatMember, ChatMemberResponse } from '../schema/chatTypes';
import { CreateChatMemberInput, UpdateChatMemberInput } from '../schema/chatInputs';
import { ChatMembersService } from '../../../services/chatService';
import { ValidationError } from '../../common/errors/graphql.error';
import { LogOperationMiddleware } from '../../../middleware/loggerMiddleware';
import logger from '../../../config/logger';

/**
 * GraphQL mutation resolvers for chat-related operations
 */
@Service()
@Resolver(Chat)
@UseMiddleware(LogOperationMiddleware)
export class ChatMutations {
  constructor(private chatsService: ChatsService) {}

  /**
   * Mutation to create a new chat
   * 
   * @param input - Chat creation data
   * @returns Response containing the newly created chat or error details
   * 
   * @example
   * ```graphql
   * mutation { createChat (
   *    input: {
   *        type: "group",
   *        creator_id: 1,
   *        title: "chat title (optional depending on type)",
   *        password: "chat password (optional)",
   *        profile_pic: "chat picture (optional)",
   *        creator_id: 1
   *    }) {
   *        success 
   *        chat { 
   *            id 
   *            type
   *            title 
   *            creator { 
   *                first_name 
   *                last_name 
   *                email 
   *            } 
   *            creator_id 
   *        } 
   *        errors { 
   *            field 
   *            message 
   *        }
   *    }
   * }
   * ```
   */
  @Mutation(() => ChatResponse)
  async createChat(@Arg('input') input: CreateChatInput): Promise<ChatResponse> {
    try {
      const chat = await this.chatsService.create(input);
      logger.info('Chat creation successful', { 
        chatId: chat.id,
      });
      return {
        success: true,
        chat
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create chat'
        }]
      };
    }
  }

  /**
   * Mutation to update an existing chat
   * 
   * @param id - ID of the chat to update
   * @param input - Updated chat data
   * @returns Response containing the updated chat or error details
   * 
   * @example
   * ```graphql
   * mutation { 
   *    updateChat (
   *        id: 1,
   *        input: {
   *            title: "updated title",
   *            password: "changed password",
   *            profile_pic: "updated image"
   *        }
   *    ) {
   *        success 
   *        chat { 
   *            id 
   *            type
   *            title
   *            creator { 
   *                first_name 
   *                last_name 
   *                email 
   *            } 
   *            creator_id 
   *        } 
   *        errors { 
   *            field 
   *            message 
   *        }
   *    }
   * }
   * ```
   */
  @Mutation(() => ChatResponse)
  async updateChat(
    @Arg('id', () => Int) id: number,
    @Arg('input') input: UpdateChatInput
  ): Promise<ChatResponse> {
    try {
      const chat = await this.chatsService.update(id, input);
      logger.info('Chat update successful', { 
        chatId: id,
        updates: input 
      });
      return {
        success: true,
        chat
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update chat'
        }]
      };
    }
  }

  /**
   * Mutation to delete a chat
   * @param id - ID of the chat to delete
   * @returns Response indicating success or failure
   * 
   * @example
   * ```graphql
   * mutation { deleteChat(id: 1) {
   *    success
   *    errors {
   *        field
   *        message
   *    }
   * }}
   * ```
   */
  @Mutation(() => ChatResponse)
  async deleteChat(@Arg('id', () => Int) id: number): Promise<ChatResponse> {
    try {
      await this.chatsService.delete(id);
      logger.info('Chat deletion successful', { 
        chatId: id 
      });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete chat'
        }]
      };
    }
  }
} 


/**
 * GraphQL mutation resolvers for member-related operations
 */
@Service()
@Resolver(ChatMember)
@UseMiddleware(LogOperationMiddleware)
export class ChatMemberMutations {
  constructor(private chatMembersService: ChatMembersService) {}

  /**
   * Mutation to add a Chat/User relation
   * e.g. add a User to a Chat
   * @param input - Chat/User creation data
   * @returns Response containing the newly created Chat/User relation or error details
   * 
   * @example
   * ```graphql
   * mutation { 
   *    createChat(
   *        input: {
   *            chat_id: 3,
   *            user_id: 31
   *        }
   *    ) { 
   *        success 
   *        chat_member { 
   *            chat { 
   *                type
   *                title
   *                creator { 
   *                    first_name 
   *                    last_name 
   *                } 
   *                creator_id 
   *            } 
   *            chat_id 
   *            user { 
   *                first_name 
   *                last_name 
   *            } 
   *            user_id 
   *            role 
   *            status 
   *        }
   *        errors { 
   *            field 
   *            message 
   *        }
   *    } 
   * }
   * ```
   */
  @Mutation(() => ChatMemberResponse)
  async createChatMember(@Arg('input') input: CreateChatMemberInput): Promise<ChatMemberResponse> {
    try {
      const chat_member = await this.chatMembersService.create(input);
      
      logger.info('Chat/User relation creation successful', { 
        chatId: chat_member.chat_id,
        userId: chat_member.user_id,
      });

      return {
        success: true,
        chat_member
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to create chat/user relation'
        }]
      };
    }
  }

  /**
   * Mutation to update the role/status of a User in a Chat
   * 
   * @param chat_id - ID of the chat to update from
   * @param user_id - ID of the user to update
   * @param input - Updated user role/status data
   * @returns Response containing the updated chat/user relation or error details
   * 
   * @example
   * ```graphql
   * mutation { 
   *    updateChatMember(
   *        chat_id: 3,
   *        user_id: 41, 
   *        input: {
   *            role: "member",
   *            status: "active"
   *        }
   *    ) { 
   *        success 
   *        chat_member { 
   *            chat { 
   *                type
   *                title
   *                creator { 
   *                    first_name 
   *                    last_name 
   *                } 
   *                creator_id 
   *            } 
   *            chat_id 
   *            user { 
   *                first_name 
   *                last_name 
   *            } 
   *            user_id 
   *            role 
   *            status 
   *        }
   *        errors { 
   *            field 
   *            message 
   *        }
   *    } 
   * }
   * ```
   */
  @Mutation(() => ChatMemberResponse)
  async updateChatMember(
    @Arg('chat_id', () => Int) chat_id: number,
    @Arg('user_id', () => Int) user_id: number,
    @Arg('input') input: UpdateChatMemberInput
  ): Promise<ChatMemberResponse> {
    try {
      const chat_member = await this.chatMembersService.update(chat_id, user_id, input);
      
      logger.info('Chat/User relation update successful', { 
        chatId: chat_member.chat_id,
        userId: chat_member.user_id,
        updates: input 
      });

      return {
        success: true,
        chat_member
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to update chat/user relation'
        }]
      };
    }
  }

  /**
   * Mutation to remove a Chat/User Relation
   * i.e. remove a Member from a Chat
   * @param chat_id - ID of the chat to delete from
   * @param user_id - ID of the user to delete
   * @returns Response indicating success or failure
   * 
   * @example
   * ```graphql
   * mutation {
   *    deleteChatMember(chat_id: 1, user_id: 1) {
   *        success
   *        errors {
   *            field
   *            message
   *        }
   *    }
   * }
   * ```
   */
  @Mutation(() => ChatMemberResponse)
  async deleteChatMember(
    @Arg('chat_id', () => Int) chat_id: number,
    @Arg('user_id', () => Int) user_id: number,
  ): Promise<ChatMemberResponse> {
    try {
      await this.chatMembersService.delete(chat_id, user_id);

      logger.info('Chat/User relation deletion successful', { 
        chatId: chat_id,
        userId: user_id
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'general',
          message: error instanceof Error ? error.message : 'Failed to delete chat/user relation'
        }]
      };
    }
  }
} 