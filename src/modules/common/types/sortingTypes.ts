import { Prisma } from '@prisma/client';
import { UserSortType } from './enumTypes';

export const usersSortingConfig: Record<UserSortType | 'NONE', Prisma.UserOrderByWithRelationInput | undefined> = {
  POINTS_ALL: {
    point: {
      points: 'desc'
    }
  },
  POINTS_WEEKLY: {
    point: {
      weekly_points: 'desc'
    }
  },
  POINTS_MONTHLY: {
    point: {
      monthly_points: 'desc'
    }
  },
  NONE: undefined
} as const;