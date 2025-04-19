import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { differenceInDays, startOfDay, format, getDay, isMonday, startOfWeek, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import logger from '../config/logger';
import { WeeklyLoginStatus } from '../modules/user/schema/userTypes';

type WeeklyLogins = Record<string, number>;

/**
 * Service handling user login streak operations
 * 
 * This service provides methods for managing user login streaks, including:
 * - Updating streak records when user creates posts
 * - Retrieving streak information
 * 
 * @remarks
 * Uses Prisma as the ORM for database operations
 */
@Service()
export class LoginStreakService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Format weekly logins into a frontend-friendly format
   * 
   * @param weeklyLogins - Raw weekly logins object
   * @param timezone - User's timezone for day calculation
   * @returns Array of formatted day objects for frontend
   */
  private formatWeeklyLoginsForFrontend(weeklyLogins: WeeklyLogins, timezone: string): WeeklyLoginStatus[] {
    const dayLabels = ['S', 'M', 'T', 'W', 'TH', 'F', 'S'];
    const nowInUserTz = toZonedTime(new Date(), timezone);

    logger.info('nowInUserTz', { nowInUserTz });
    const currentDayIndex = getDay(nowInUserTz); // 0 = Sunday, 1 = Monday, etc.
    logger.info('currentDayIndex', { currentDayIndex });

    logger.info('weeklyLogins', { weeklyLogins });

    
    // Convert weekly_logins object to a boolean array for each day of the week
    const result: WeeklyLoginStatus[] = [];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(nowInUserTz);
      // Calculate the date for this day of the week
      // First find how many days to go back to get to this day
      const daysToSubtract = (currentDayIndex - i + 7) % 7;
      dayDate.setDate(dayDate.getDate() - daysToSubtract);
      
      const dayKey = format(dayDate, 'yyyy-MM-dd');
      // Ensure hasLoggedIn is a boolean value
      const hasLoggedIn = !!(weeklyLogins[dayKey] && weeklyLogins[dayKey] > 0);
      
  // 添加这个日志
  logger.info(`Day calculation for index ${i}`, {
    dayLabel: dayLabels[i],
    calculatedDate: dayDate.toISOString(),
    dayKey,
    hasLoggedIn,
    hasMatchingEntry: dayKey in weeklyLogins,
    entryValue: weeklyLogins[dayKey]
  });
      result.push({
        label: dayLabels[i],
        completed: hasLoggedIn
      });
    }
    
    return result;
  }

  /**
   * Check if we need to reset weekly logins (resets every Monday)
   * 
   * @param weeklyLogins - Current weekly logins object
   * @param today - Reference date (usually today)
   * @param lastLoginDate - User's last login date
   * @returns Boolean indicating if weekly logins should be reset
   */
  private shouldResetWeeklyLogins(today: Date, lastLoginDate: Date): boolean {
    // Reset if today is Monday and last login was before today
    logger.info('shouldResetWeeklyLogins: today', { today });
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    logger.info('shouldResetWeeklyLogins: thisWeekStart', { thisWeekStart });
    const lastLoginWeekStart = startOfWeek(lastLoginDate, { weekStartsOn: 0 });
    logger.info('shouldResetWeeklyLogins: lastLoginWeekStart', { lastLoginWeekStart });
    logger.info('shouldResetWeeklyLogins: isSameDay', { isSameDay: isSameDay(thisWeekStart, lastLoginWeekStart) });
    // 如果这两个日期不是同一周，就需要重置
    return !isSameDay(thisWeekStart, lastLoginWeekStart);
  }

  /**
   * Update a user's login streak when they create a post
   * Streaks only increment once per day, but post count for the day increments with each post
   * 
   * @param userId - The unique identifier of the user
   * @param timezone - The user's timezone
   * @returns Promise<void>
   * @throws {PrismaError} If database operation fails
   */
  async updateLoginStreak(userId: number, timezone: string): Promise<void> {
    try {
      // Get today's date in user's timezone
      const nowInUserTz = toZonedTime(new Date(), timezone || 'UTC');
      const todayInUserTz = startOfDay(nowInUserTz);
      const todayKey = format(todayInUserTz, 'yyyy-MM-dd');
      logger.info('updateLoginStreak: Start', { userId, timezone, todayKey, todayInUserTz });
      
      // Find existing streak record
      const loginStreak = await this.prisma.userLoginStreak.findUnique({
        where: { user_id: userId }
      });
      logger.info('updateLoginStreak: Found existing streak record', { userId, loginStreak: !!loginStreak });

      // If new user with no streak record yet
      if (!loginStreak) {
        logger.info('updateLoginStreak: New user, creating initial record', { userId });
        const initialWeeklyLogins: WeeklyLogins = {};
        initialWeeklyLogins[todayKey] = 1;
        
        await this.prisma.userLoginStreak.create({
          data: {
            user_id: userId,
            last_login_date: todayInUserTz,
            streak_count: 1,
            weekly_logins: initialWeeklyLogins
          }
        });
        
        logger.info('Created new login streak record', {
          userId,
          streakCount: 1,
          todayKey
        });
        return;
      }

      // Handle existing user with streak record
      logger.info('updateLoginStreak: Existing user', { userId });
      let weeklyLogins = (typeof loginStreak.weekly_logins === 'object' && loginStreak.weekly_logins !== null)
        ? loginStreak.weekly_logins as WeeklyLogins
        : {};
      logger.info('updateLoginStreak: Initial weeklyLogins', { userId, weeklyLogins });
      
      // Convert last login date to user timezone for comparison
      // const lastLoginInUserTz = toZonedTime(loginStreak.last_login_date, timezone || 'UTC');
      const lastLoginDayStart = startOfDay(loginStreak.last_login_date);
      logger.info('updateLoginStreak: Calculated last login date in user timezone', { userId, lastLoginDayStart });
      
      
      // Calculate days since last active post
      const daysSinceLastLogin = differenceInDays(todayInUserTz, lastLoginDayStart);
      logger.info('updateLoginStreak: Days since last login', { userId, daysSinceLastLogin });
      
      // Check if we need to reset weekly logins (new week started)
      const needsWeeklyReset = this.shouldResetWeeklyLogins(todayInUserTz, lastLoginDayStart);
      logger.info('updateLoginStreak: Check weekly reset needed', { userId, needsWeeklyReset });
      if (needsWeeklyReset) {
        logger.info('Resetting weekly logins for new week', {
          userId,
          isMonday: isMonday(todayInUserTz),
          daysSinceLastLogin
        });
        weeklyLogins = {};
        // Add today's login immediately after reset
        weeklyLogins[todayKey] = 1;
        logger.info('updateLoginStreak: weeklyLogins after reset', { userId, weeklyLogins });
      }
      
      // Check if already posted today (increment post count but don't change streak)
      if (daysSinceLastLogin === 0) {
        logger.info('updateLoginStreak: Same day login/post', { userId });
        weeklyLogins[todayKey] = (weeklyLogins[todayKey] || 0) + 1;
        
        await this.prisma.userLoginStreak.update({
          where: { user_id: userId },
          data: {
            weekly_logins: weeklyLogins
          }
        });
        
        logger.info('Updated post count for today', {
          userId,
          todayKey,
          postCount: weeklyLogins[todayKey]
        });
        return;
      }
      
      // New day, check if consecutive
      if (daysSinceLastLogin === 1) {
        logger.info('updateLoginStreak: Consecutive day login/post', { userId });
        // Consecutive day, increment streak
        weeklyLogins[todayKey] = 1;
        const newStreakCount = loginStreak.streak_count + 1;
        
        await this.prisma.userLoginStreak.update({
          where: { user_id: userId },
          data: {
            last_login_date: todayInUserTz,
            streak_count: newStreakCount,
            weekly_logins: weeklyLogins
          }
        });
        
        logger.info('Incremented login streak', {
          userId,
          newStreakCount,
          todayKey
        });
      } else {
        logger.info('updateLoginStreak: Non-consecutive day login/post (streak broken)', { userId, daysSinceLastLogin });
        // Not consecutive, reset streak
        const resetWeeklyLogins: WeeklyLogins = {};
        resetWeeklyLogins[todayKey] = 1;
        
        await this.prisma.userLoginStreak.update({
          where: { user_id: userId },
          data: {
            last_login_date: todayInUserTz,
            streak_count: 1,
            weekly_logins: resetWeeklyLogins
          }
        });
        
        logger.info('Reset login streak', {
          userId,
          daysSinceLastLogin,
          todayKey
        });
      }

      logger.info('Date comparison details', {
        nowInUserTz: nowInUserTz.toISOString(),
        todayInUserTz: todayInUserTz.toISOString(),
        lastLoginInUserTz: loginStreak.last_login_date.toISOString(),
        lastLoginDayStart: lastLoginDayStart.toISOString(),
        daysSinceLastLogin,
        lastLoginDate_from_db: loginStreak.last_login_date.toISOString()
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
   * @param timezone - The user's timezone (optional)
   * @returns Promise<Object> Formatted login streak data or null if not found
   * @throws {PrismaError} If database query fails
   */
  async getLoginStreak(userId: number, timezone?: string): Promise<{
    streak_count: number;
    weekly_logins: Record<string, number>;
    formatted_weekly_logins: WeeklyLoginStatus[];
    last_login_date?: Date;
  } | null> {
    try {
      const loginStreak = await this.prisma.userLoginStreak.findUnique({
        where: { user_id: userId }
      });

      if (!loginStreak) {
        return null;
      }

      // Ensure weekly_logins is correctly typed and formatted
      let weeklyLogins = (typeof loginStreak.weekly_logins === 'object' && loginStreak.weekly_logins !== null)
        ? loginStreak.weekly_logins as Record<string, number>
        : {};
      
      // Use user's timezone or default to UTC
      const userTimezone = timezone || 'UTC';
      
      // If timezone provided, check if we need to update streak status
      if (userTimezone) {
        const nowInUserTz = toZonedTime(new Date(), userTimezone);

        const todayInUserTz = startOfDay(nowInUserTz);

        // const lastLoginInUserTz = toZonedTime(loginStreak.last_login_date, userTimezone);
        const lastLoginDayStart = startOfDay(loginStreak.last_login_date);
        
        logger.info('userTimezone', { userTimezone });
        logger.info('todayInUserTz', { todayInUserTz });
        logger.info('lastLoginDayStart', { lastLoginDayStart });    
        logger.info('nowInUserTz', { nowInUserTz });    

        // Calculate days since last login
        const daysSinceLastLogin = differenceInDays(todayInUserTz, lastLoginDayStart);
        logger.info('daysSinceLastLogin', { daysSinceLastLogin });
        
        let updateNeeded = false;
        let newStreakCount = loginStreak.streak_count;
        
        // Check if we need to reset weekly logins (new week started)
    // 在 getLoginStreak 函数中
    if (this.shouldResetWeeklyLogins(todayInUserTz, lastLoginDayStart)) {
      const todayKey = format(todayInUserTz, 'yyyy-MM-dd');
      const todayCount = weeklyLogins[todayKey];  // 获取今天的计数
      
      logger.info('todayCount', { todayCount });

      weeklyLogins = {};  // 清空旧的记录
      
      // 如果今天（周一）已经有记录，保留它
      if (todayCount) {
        weeklyLogins[todayKey] = todayCount;
      }
      
      updateNeeded = true;
      logger.info('Reset weekly logins during query', { 
        userId,
        weeklyLogins,  // 记录最终的状态
        preservedTodayCount: todayCount  // 记录保留的今天的计数
      });
    }
        
        // If more than a day has passed without a login, reset streak
        if (daysSinceLastLogin > 1) {
          newStreakCount = 0; // Reset to 0 since user hasn't posted today
          updateNeeded = true;
          logger.info('Reset streak count during query', { userId, daysSinceLastLogin });
        }
        
        // If updates needed, persist to database
        if (updateNeeded) {
          await this.prisma.userLoginStreak.update({
            where: { user_id: userId },
            data: {
              streak_count: newStreakCount,
              weekly_logins: weeklyLogins
            }
          });
          
          return {
            streak_count: newStreakCount,
            weekly_logins: weeklyLogins,
            formatted_weekly_logins: this.formatWeeklyLoginsForFrontend(weeklyLogins, userTimezone),
            last_login_date: loginStreak.last_login_date
          };
        }
      }

      // Generate formatted weekly logins for frontend
      const formattedWeeklyLogins = this.formatWeeklyLoginsForFrontend(
        weeklyLogins, 
        userTimezone
      );

      return {
        streak_count: loginStreak.streak_count,
        weekly_logins: weeklyLogins,
        formatted_weekly_logins: formattedWeeklyLogins,
        last_login_date: loginStreak.last_login_date
      };
    } catch (error) {
      logger.error('Failed to get login streak', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
} 