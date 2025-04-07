import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { differenceInDays, startOfDay, format, getDay, isMonday } from 'date-fns';
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
    const currentDayIndex = getDay(nowInUserTz); // 0 = Sunday, 1 = Monday, etc.
    
    // Convert weekly_logins object to a boolean array for each day of the week
    const result: WeeklyLoginStatus[] = [];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(nowInUserTz);
      // Calculate the date for this day of the week
      // First find how many days to go back to get to this day
      const daysToSubtract = (currentDayIndex - i + 7) % 7;
      dayDate.setDate(dayDate.getDate() - daysToSubtract);
      
      const dayKey = format(toZonedTime(dayDate, timezone), 'yyyy-MM-dd');
      // Ensure hasLoggedIn is a boolean value
      const hasLoggedIn = !!(weeklyLogins[dayKey] && weeklyLogins[dayKey] > 0);
      
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
    if (isMonday(today) && differenceInDays(today, lastLoginDate) >= 1) {
      return true;
    }
    
    // Also reset if last login was from a previous week (crossed a Monday)
    const todayDay = getDay(today); // 0 = Sunday, 1 = Monday, etc.
    const daysSinceLastLogin = differenceInDays(today, lastLoginDate);
    
    // If we've crossed a Monday boundary since last login
    if (daysSinceLastLogin > todayDay || (todayDay === 0 && daysSinceLastLogin >= 1)) {
      return true;
    }
    
    return false;
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
      
      // Find existing streak record
      const loginStreak = await this.prisma.userLoginStreak.findUnique({
        where: { user_id: userId }
      });

      // If new user with no streak record yet
      if (!loginStreak) {
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
      let weeklyLogins = (typeof loginStreak.weekly_logins === 'object' && loginStreak.weekly_logins !== null)
        ? loginStreak.weekly_logins as WeeklyLogins
        : {};
      
      // Convert last login date to user timezone for comparison
      const lastLoginInUserTz = toZonedTime(loginStreak.last_login_date, timezone || 'UTC');
      const lastLoginDayStart = startOfDay(lastLoginInUserTz);
      
      // Calculate days since last active post
      const daysSinceLastLogin = differenceInDays(todayInUserTz, lastLoginDayStart);
      
      // Check if we need to reset weekly logins (new week started)
      if (this.shouldResetWeeklyLogins(todayInUserTz, lastLoginDayStart)) {
        logger.info('Resetting weekly logins for new week', {
          userId,
          isMonday: isMonday(todayInUserTz),
          daysSinceLastLogin
        });
        weeklyLogins = {};
      }
      
      // Check if already posted today (increment post count but don't change streak)
      if (daysSinceLastLogin === 0) {
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
        // Consecutive day, increment streak
        weeklyLogins[todayKey] = 1;
        
        await this.prisma.userLoginStreak.update({
          where: { user_id: userId },
          data: {
            last_login_date: todayInUserTz,
            streak_count: loginStreak.streak_count + 1,
            weekly_logins: weeklyLogins
          }
        });
        
        logger.info('Incremented login streak', {
          userId,
          newStreakCount: loginStreak.streak_count + 1,
          todayKey
        });
      } else {
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
        const lastLoginInUserTz = toZonedTime(loginStreak.last_login_date, userTimezone);
        const lastLoginDayStart = startOfDay(lastLoginInUserTz);
        
        // Calculate days since last login
        const daysSinceLastLogin = differenceInDays(todayInUserTz, lastLoginDayStart);
        
        let updateNeeded = false;
        let newStreakCount = loginStreak.streak_count;
        
        // Check if we need to reset weekly logins (new week started)
        if (this.shouldResetWeeklyLogins(todayInUserTz, lastLoginDayStart)) {
          weeklyLogins = {};
          updateNeeded = true;
          logger.info('Reset weekly logins during query', { userId });
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