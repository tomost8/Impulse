import { registerEnumType } from 'type-graphql';
import { Role as PrismaRole, RequestStatus as PrismaRequestStatus, Category as PrismaCategory, UserSortType as PrismaUserSortType, ChallengeLength as PrismaChallengeLength, ChallengeStatus as PrismaChallengeStatus, BadgeLevel as PrismaBadgeLevel, MessageStatus as PrismaMessageStatus } from '@prisma/client';

// Re-export Prisma's enums
export const Category = PrismaCategory;
export type Category = PrismaCategory;

export const Role = PrismaRole;
export type Role = PrismaRole;

export const RequestStatus = PrismaRequestStatus;
export type RequestStatus = PrismaRequestStatus;

export const UserSortType = PrismaUserSortType;
export type UserSortType = PrismaUserSortType;

export const ChallengeLength = PrismaChallengeLength;
export type ChallengeLength = PrismaChallengeLength;

export const ChallengeStatus = PrismaChallengeStatus;
export type ChallengeStatus = PrismaChallengeStatus;

export const BadgeLevel = PrismaBadgeLevel;
export type BadgeLevel = PrismaBadgeLevel;

export const MessageStatus = PrismaMessageStatus;
export type MessageStatus = PrismaMessageStatus;

// Register the enums with type-graphql
registerEnumType(Category, {
  name: 'Category',
});

registerEnumType(Role, {
  name: 'Role',
});

registerEnumType(RequestStatus, {
  name: 'RequestStatus',
});

registerEnumType(UserSortType, {
  name: 'UserSortType',
});

registerEnumType(ChallengeLength, {
  name: 'ChallengeLength',
});

registerEnumType(ChallengeStatus, {
  name: 'ChallengeStatus',
});

registerEnumType(BadgeLevel, {
  name: 'BadgeLevel',
});

registerEnumType(MessageStatus, {
  name: 'MessageStatus',
});
