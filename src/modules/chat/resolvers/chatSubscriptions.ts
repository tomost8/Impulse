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
  constructor(private prisma: PrismaClient) {}

  /** Check if a user should receive this message */
  private isMessageRecipient = async (userId: number, chatId: number, senderId: number): Promise<boolean> => {
    // Sender always receives own message
    if (userId === senderId) return true;

    console.log("isMessageRecipient");

    // Is the user a chat member?
    const member = await this.prisma.chatMember.findUnique({
      where: { chat_id_user_id: { chat_id: chatId, user_id: userId } },
    });

    console.log("isMessageRecipient userId", userId, "chatId", chatId, "senderId", senderId, "member", member)
    if (member) return true;

    // If private chat (2 members), allow member to receive
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { chat_members: true },
    });
    if (chat?.chat_members.length === 2) {
      return chat.chat_members.some((m: any) => m.user_id === userId);
    }

    return false;
  }

  /** Subscription for new messages */
  @Subscription(() => Message, {
    topics: CHAT_MESSAGE_SENT,
    filter: async ({ payload, context }: { payload: SubscriptionPayload; context: Context }) => {
      const { user } = context;
      console.log("Subscription filter");
      console.log("Subscription filter user", user);
      return await this?.isMessageRecipient(user.id, payload.messageSent.chat_id, payload.messageSent.sender_id);
    },
  })
  messageSent(@Root() payload: SubscriptionPayload): Message {
    console.log("in subscription")
    return payload.messageSent;
  }
}