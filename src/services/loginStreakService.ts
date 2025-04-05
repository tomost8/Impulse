import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { differenceInDays, startOfDay, endOfDay } from 'date-fns';
import logger from '../config/logger';

/**
 * Service handling user login streak operations
 * 
 * This service provides methods for managing user login streaks, including:
 * - Updating login streak records
 * - Retrieving login streak information
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class LoginStreakService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Update a user's login streak
   * 
   * @param userId - The unique identifier of the user
   * @param timezone - The user's timezone
   * @returns Promise<void>
   * @throws {PrismaError} If database operation fails
   */
  async updateLoginStreak(userId: number, timezone: string): Promise<void> {
    try {
      // 获取用户的登录记录
      const loginStreak = await this.prisma.userLoginStreak.findUnique({
        where: { user_id: userId }
      });

      const now = new Date();
      const today = startOfDay(now);
      const yesterday = startOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));

      // 如果是新用户，创建登录记录
      if (!loginStreak) {
        await this.prisma.userLoginStreak.create({
          data: {
            user_id: userId,
            last_login_date: today,
            streak_count: 1,
            max_streak_count: 1,
            weekly_logins: {
              [today.toISOString().split('T')[0]]: 1
            } as any
          }
        });
        return;
      }

      // 计算与上次登录的日期差
      const daysSinceLastLogin = differenceInDays(today, loginStreak.last_login_date);

      // 更新连续登录记录
      const updatedStreak = {
        last_login_date: today,
        streak_count: daysSinceLastLogin === 1 ? loginStreak.streak_count + 1 : 1,
        max_streak_count: daysSinceLastLogin === 1 
          ? Math.max(loginStreak.streak_count + 1, loginStreak.max_streak_count)
          : Math.max(1, loginStreak.max_streak_count),
        weekly_logins: {
          ...(loginStreak.weekly_logins as Record<string, number> || {}),
          [today.toISOString().split('T')[0]]: ((loginStreak.weekly_logins as Record<string, number>)?.[today.toISOString().split('T')[0]] || 0) + 1
        } as any
      };

      // 保存更新
      await this.prisma.userLoginStreak.update({
        where: { user_id: userId },
        data: updatedStreak
      });

      logger.info('Login streak updated', {
        userId,
        streakCount: updatedStreak.streak_count,
        maxStreakCount: updatedStreak.max_streak_count
      });
    } catch (error) {
      logger.error('Failed to update login streak', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get a user's login streak information
   * 
   * @param userId - The unique identifier of the user
   * @param timezone - The user's timezone
   * @returns Promise<LoginStreak | null> The login streak information or null if not found
   * @throws {PrismaError} If database query fails
   */
  async getLoginStreak(userId: number, timezone: string): Promise<any | null> {
    try {
      return await this.prisma.userLoginStreak.findUnique({
        where: { user_id: userId }
      });
    } catch (error) {
      logger.error('Failed to get login streak', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
} 