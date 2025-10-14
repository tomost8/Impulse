import { Resolver, Subscription, Root } from 'type-graphql';
import { Service } from 'typedi';
import { Message } from '../schema/chatTypes';
import { CHAT_MESSAGE_SENT } from '../../../config/pubsub';
import { PrismaClient } from '@prisma/client';

interface SubscriptionPayload {
  messageSent: Message & { chat_id: number };
}

interface Context {
  user: { id: number };
}

@Service()
@Resolver()
export class ChatSubscriptions {
  private static async isMessageRecipient( prisma: PrismaClient, userId: number, chatId: number, senderId: number ): Promise<boolean> {
    if (userId === senderId) return true;

    const member = await prisma.chatMember.findUnique({
      where: { chat_id_user_id: { chat_id: chatId, user_id: userId } },
    });

    if (member) return true;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { chat_members: true },
    });
    if (chat?.chat_members.length === 2) {
      return chat.chat_members.some((m: any) => m.user_id === userId);
    }

    return false;
  }

  @Subscription(() => Message, {
    topics: CHAT_MESSAGE_SENT,
    filter: async ({ payload, context }: { payload: SubscriptionPayload; context: Context }) => {
      const { user } = context;
      return await ChatSubscriptions.isMessageRecipient( new PrismaClient(), user.id, payload.messageSent.chat_id, payload.messageSent.sender_id );
    },
  })
  messageSent(@Root() payload: SubscriptionPayload): Message {
    return payload.messageSent;
  }
}