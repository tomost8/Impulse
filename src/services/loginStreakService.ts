import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { differenceInDays, startOfDay, endOfDay, getDay } from 'date-fns';
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
   * Get the day number (1-7) for a given date
   * Returns: 1 (Monday) to 7 (Sunday)
   */
  private getDayNumber(date: Date): number {
    const day = getDay(date);
    return day === 0 ? 7 : day; // Convert Sunday(0) to 7, keeping Monday(1) as 1
  }

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
      const loginStreak = await this.prisma.userLoginStreak.findUnique({
        where: { user_id: userId }
      });

      const now = new Date();
      const today = startOfDay(now);
      const dayNumber = this.getDayNumber(now);

      // 如果是新用户，创建登录记录
      if (!loginStreak) {
        await this.prisma.userLoginStreak.create({
          data: {
            user_id: userId,
            last_login_date: today,
            streak_count: 1,
            max_streak_count: 1,
            weekly_logins: [dayNumber] // 数组中只包含今天的登录日
          }
        });
        return;
      }

      // 计算与上次登录的日期差
      const daysSinceLastLogin = differenceInDays(today, loginStreak.last_login_date);
      const lastLoginDay = new Date(loginStreak.last_login_date);

      // 如果是新的一周，重置记录
      if (differenceInDays(today, startOfDay(lastLoginDay)) >= 7) {
        await this.prisma.userLoginStreak.update({
          where: { user_id: userId },
          data: {
            last_login_date: today,
            streak_count: 1,
            weekly_logins: [dayNumber] // 新的一周只包含今天
          }
        });
        return;
      }

      // 获取当前的连续登录记录
      let weeklyLogins = Array.isArray(loginStreak.weekly_logins) 
        ? loginStreak.weekly_logins as number[]
        : [];

      // 如果今天还没有记录，添加到数组中
      if (!weeklyLogins.includes(dayNumber)) {
        weeklyLogins.push(dayNumber);
        // 按照日期排序
        weeklyLogins.sort((a, b) => a - b);
      }

      const updatedStreak = {
        last_login_date: today,
        streak_count: daysSinceLastLogin === 1 ? loginStreak.streak_count + 1 : 1,
        max_streak_count: daysSinceLastLogin === 1 
          ? Math.max(loginStreak.streak_count + 1, loginStreak.max_streak_count)
          : Math.max(1, loginStreak.max_streak_count),
        weekly_logins: weeklyLogins
      };

      // 保存更新
      await this.prisma.userLoginStreak.update({
        where: { user_id: userId },
        data: updatedStreak
      });

      logger.info('Login streak updated', {
        userId,
        streakCount: updatedStreak.streak_count,
        maxStreakCount: updatedStreak.max_streak_count,
        weeklyLogins
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