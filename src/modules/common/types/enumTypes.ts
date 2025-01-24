import { registerEnumType } from 'type-graphql';
import { Role as PrismaRole, RequestStatus as PrismaRequestStatus, 
  Category as PrismaCategory, UserSortType as PrismaUserSortType } from '@prisma/client';

// Re-export Prisma's enums
export const Category = PrismaCategory;
export type Category = PrismaCategory;

export const Role = PrismaRole;
export type Role = PrismaRole;

export const RequestStatus = PrismaRequestStatus;
export type RequestStatus = PrismaRequestStatus;

export const UserSortType = PrismaUserSortType;
export type UserSortType = PrismaUserSortType;

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
