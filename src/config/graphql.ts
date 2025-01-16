import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { UserQueries, UserMutations } from '../modules/user';
import { CommunityQueries, CommunityMutations, CommunityMemberQueries, CommunityMemberMutations, CommunityCategoryQueries, CommunityCategoryMutations} from '../modules/community';
import { ChatQueries, ChatMutations, ChatMemberQueries, ChatMemberMutations, MessageQueries, MessageMutations } from '../modules/chat';
import { ActivityQueries, ActivityMutations } from '../modules/activity';
import { PostQueries, PostMutations } from '../modules/post';
import { TimeSubscriptions } from '../modules/common/resolvers/timeSubscriptions';
import { pubsub } from '../services/timeService';
import './prisma'; // 确保 Prisma 客户端被初始化

export const createSchema = async () => {
  const schema = await buildSchema({
    resolvers: [
      UserQueries, 
      UserMutations, 
      CommunityQueries, 
      CommunityMutations, 
      CommunityMemberQueries, 
      CommunityMemberMutations,
      CommunityCategoryQueries,
      CommunityCategoryMutations,
      ChatQueries, 
      ChatMutations, 
      ChatMemberQueries, 
      ChatMemberMutations,
      MessageQueries,
      MessageMutations,
      ActivityQueries,
      ActivityMutations,
      PostQueries,
      PostMutations,
      TimeSubscriptions
    ],
    container: Container,
    validate: { forbidUnknownValues: false },
    // @ts-ignore: type-graphql 和 yoga pubsub 类型不匹配
    pubSub: pubsub,
    emitSchemaFile: process.env.NODE_ENV !== 'production', // 只在非生产环境生成 schema 文件
  });

  return schema;
}; 