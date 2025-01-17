import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { UserQueries, UserMutations } from '../modules/user';
import { FriendshipQueries, FriendshipMutations } from '../modules/friendship';
import { CommunityQueries, CommunityMutations, CommunityMemberQueries, CommunityMemberMutations, CommunityCategoryQueries, CommunityCategoryMutations} from '../modules/community';
import { ChatQueries, ChatMutations, ChatMemberQueries, ChatMemberMutations, MessageQueries, MessageMutations } from '../modules/chat';
import { ActivityQueries, ActivityMutations } from '../modules/activity';
import { PostQueries, PostMutations } from '../modules/post';
import { TimeSubscriptions } from '../modules/common/resolvers/timeSubscriptions';
import { UserSubscriptions } from '../modules/user/resolvers/userSubscriptions';
import { pubsub } from './pubsub';
import { PointQueries, PointMutations, RewardQueries, RewardMutations, RedeemQueries, RedeemMutations } from '../modules/point';
import { DateScalar } from '../modules/common/scalars/dateScalar';

import './prisma'; // 确保 Prisma 客户端被初始化

export const createSchema = async () => {
  const schema = await buildSchema({
    resolvers: [
      UserQueries, 
      UserMutations, 
      FriendshipQueries,
      FriendshipMutations,
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
      TimeSubscriptions,
      UserSubscriptions,
      PointQueries, 
      PointMutations, 
      RewardQueries, 
      RewardMutations, 
      RedeemQueries, 
      RedeemMutations
    ],
    container: Container,
    validate: { forbidUnknownValues: false },
    // @ts-ignore: type-graphql 和 yoga pubsub 类型不匹配
    pubSub: pubsub,
    emitSchemaFile: process.env.NODE_ENV !== 'production', // 只在非生产环境生成 schema 文件
  });

  return schema;
}; 