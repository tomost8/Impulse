import { Resolver, Subscription, Root } from 'type-graphql';
import { Service } from 'typedi';
import { Message } from '../schema/chatTypes';
import { CHAT_MESSAGE_SENT } from '../../../config/pubsub';
import { PrismaClient, ChatMember, Chat } from '@prisma/client';

interface SubscriptionPayload {
  messageSent: Message & {
    chat_id: number;
  };
}

interface Context {
  user: {
    id: number;
  };
}

@Service()
@Resolver()
export class ChatSubscriptions {
  constructor(private prisma: PrismaClient) {}

  private async isMessageRecipient(userId: number, chatId: number): Promise<boolean> {
    // 1. 检查是否是聊天室成员
    const isChatMember = await this.prisma.chatMember.findUnique({
      where: {
        chat_id_user_id: {
          chat_id: chatId,
          user_id: userId
        }
      }
    });

    if (isChatMember) return true;

    // 2. 如果不是成员，检查是否是新创建的私聊
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        chat_members: true
      }
    });

    // 如果是新创建的双人聊天，且用户是其中之一
    if (chat?.chat_members.length === 2) {
      return chat.chat_members.some(member => member.user_id === userId);
    }

    return false;
  }

  @Subscription(() => Message, {
    topics: CHAT_MESSAGE_SENT,
    filter: async ({ payload }: { payload: SubscriptionPayload }) => {
      const userId = payload.messageSent.sender_id;
      const chatId = payload.messageSent.chat_id;
      
      const prisma = new PrismaClient();
      const isChatMember = await prisma.chatMember.findUnique({
        where: {
          chat_id_user_id: {
            chat_id: chatId,
            user_id: userId
          }
        }
      });

      if (isChatMember) return true;

      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          chat_members: true
        }
      });

      if (chat?.chat_members.length === 2) {
        return chat.chat_members.some(member => member.user_id === userId);
      }

      return false;
    },
    description: 'Subscribe to messages in chats where user is a member or recipient'
  })
  messageSent(@Root() payload: SubscriptionPayload): Message {
    console.log('Resolving chat message subscription data:', payload);
    return payload.messageSent;
  }
} 