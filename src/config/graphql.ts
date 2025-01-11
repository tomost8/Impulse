import { buildSchema } from 'type-graphql';
import { Container } from 'typedi';
import { UserQueries, UserMutations } from '../modules/user';
import { CommunityQueries, CommunityMutations, CommunityMemberQueries, CommunityMemberMutations } from '../modules/community';
import { ChatQueries, ChatMutations, ChatMemberQueries, ChatMemberMutations } from '../modules/chat';
import { DateScalar } from '../modules/common/scalars/dateScalar';

import './prisma'; // 确保 Prisma 客户端被初始化

export const createSchema = async () => {
    return buildSchema({
    resolvers: [UserQueries, UserMutations, CommunityQueries, CommunityMutations, CommunityMemberQueries, CommunityMemberMutations, ChatQueries, ChatMutations, ChatMemberQueries, ChatMemberMutations],
    container: Container,
    validate: { forbidUnknownValues: false },
    emitSchemaFile: process.env.NODE_ENV !== 'production', // 只在非生产环境生成 schema 文件
    scalarsMap: [
      { type: Date, scalar: DateScalar }
    ],
  });
}; 