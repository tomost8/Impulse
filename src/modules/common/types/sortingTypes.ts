import { Prisma } from '@prisma/client';
import { UserSortType } from './enumTypes';

export const usersSortingConfig: Record<UserSortType | 'NONE', Prisma.CommunityMemberOrderByWithRelationInput | undefined> = {
  POINTS_ALL: {
    user: {
      point: {
        points: 'desc'
      }
    }
  },
  POINTS_WEEKLY: {
    user: {
      point: {
        weekly_points: 'desc'
      }
    }
  },
  POINTS_MONTHLY: {
    user: {
      point: {
        monthly_points: 'desc'
      }
    }
  },
  NONE: undefined
} as const;