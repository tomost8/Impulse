// src/services/challengeService.ts
import { Service } from 'typedi';
import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import logger from '../config/logger';
import { addDays, endOfDay, startOfDay } from 'date-fns';
import { ChallengeLength, BadgeLevel, ChallengeStatus } from "../modules/common/types/enumTypes";
import { calculateBadgeLevel } from '../modules/challenge/utils/challengeUtils';
/**
 * Service handling challenge-related business logic and database operations
 *
 * This service provides methods for managing challenges in the system, including:
 * - Fetching available challenges with unlock logic
 * - Joining and tracking user challenges
 * - Submitting daily challenge entries
 * - Finalizing completed challenges and awarding badges
 *
 * @remarks
 * Uses Prisma as the ORM and integrates with user progress/badges
 */

@Service()
export class ChallengeService {
  constructor(public prisma: PrismaClient) {}

  /**
   * Retrieve all challenges and determine unlock status for a user
   *
   * @param userId - The user to check unlocks for
   * @returns Promise<any[]> Array of challenges with unlock state
   */
  async getAvailableChallengesForUser(userId: number) {
    const challenges = await this.prisma.challenge.findMany();
    const userBadges = await this.prisma.badge.findMany({ where: { user_id: userId } });

    const challengesWithUnlocked = challenges.map((ch) => {
      let unlocked = false;

      const allowed = [BadgeLevel.SILVER, BadgeLevel.GOLD, BadgeLevel.DIAMOND] as unknown as BadgeLevel[];

      if (ch.length === ChallengeLength.DAYS_7) unlocked = true;

      if (ch.length === ChallengeLength.DAYS_14) {
        const sevenChallenge = challenges.find(
          (x) => x.category === ch.category && x.length === ChallengeLength.DAYS_7
        );
        const badge = userBadges.find(
          (b) =>
            b.challenge_id === (sevenChallenge?.id ?? -1) &&
            allowed.includes(b.badge_level)
        );
        unlocked = Boolean(badge);
      }

      if (ch.length === ChallengeLength.DAYS_21) {
        const fourteenChallenge = challenges.find(
          (x) => x.category === ch.category && x.length === ChallengeLength.DAYS_14
        );
        const badge = userBadges.find(
          (b) =>
            b.challenge_id === (fourteenChallenge?.id ?? -1) &&
            allowed.includes(b.badge_level)
        );
        unlocked = Boolean(badge);
      }

      return { ...ch, unlocked };
    });

    return challengesWithUnlocked;
  }

  /**
   * Join a challenge: ensures one active per category and creates UserChallenge
   */
  async joinChallenge(userId: number, challengeId: number, deviceLocalOffsetMinutes = 0) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundError(`Challenge with id ${challengeId} not found`);

    const activeInCategory = await this.prisma.userChallenge.findFirst({
      where: {
        user_id: userId,
        status: ChallengeStatus.ACTIVE,
        challenge: { category: challenge.category },
      },
    });

    if (activeInCategory) {
      throw new ValidationError('User already has an active challenge in this category');
    }

    const now = new Date();
    const days =7; // challenge.length === 'DAYS_7'

    const startLocal = new Date(now.getTime() + deviceLocalOffsetMinutes * 60000);
    const endLocal = endOfDay(addDays(startLocal, days - 1));
    const ends_at = new Date(endLocal.getTime() - deviceLocalOffsetMinutes * 60000);

    return await this.prisma.userChallenge.create({
      data: {
        user_id: userId,
        challenge_id: challengeId,
        started_at: now,
        ends_at,
        status: ChallengeStatus.ACTIVE,
        days_completed: 0,
      },
    });
  }

  /**
   * Submit a daily entry for an active UserChallenge
   */
  async submitDayEntry(params: {
    userId: number;
    userChallengeId: number;
    postId?: number | null;
    deviceLocalOffsetMinutes?: number;
  }) {
    const { userId, userChallengeId, postId, deviceLocalOffsetMinutes = 0 } = params;

    const uc = await this.prisma.userChallenge.findUnique({ where: { id: userChallengeId } });
    if (!uc) throw new NotFoundError(`UserChallenge ${userChallengeId} not found`);
    if (uc.user_id !== userId) throw new ValidationError('Not your challenge');
    if (uc.status !== ChallengeStatus.ACTIVE) throw new ValidationError('Challenge is not active');

    const startedAtLocal = new Date(uc.started_at.getTime() + deviceLocalOffsetMinutes * 60000);
    const nowLocal = new Date(Date.now() + deviceLocalOffsetMinutes * 60000);
    const dayNumber =
      Math.floor(
        (startOfDay(nowLocal).getTime() - startOfDay(startedAtLocal).getTime()) /
          (24 * 60 * 60 * 1000)
      ) + 1;

    const challenge = await this.prisma.challenge.findUnique({ where: { id: uc.challenge_id } });
    if (!challenge) throw new NotFoundError(`Associated challenge ${uc.challenge_id} missing`);
    const maxDays =
      challenge.length === ChallengeLength.DAYS_7
        ? 7
        : challenge.length === ChallengeLength.DAYS_14
        ? 14
        : 21;

    if (dayNumber < 1 || dayNumber > maxDays) {
      throw new ValidationError('This challenge cannot be credited for today (out of range)');
    }

    const existingEntry = await this.prisma.challengeDayEntry.findFirst({
      where: {
          user_challenge: {
            user_id: userId,
            challenge: { category: challenge.category },
          },
          day_number: dayNumber,
      },
    });

    if (existingEntry) {
      throw new ValidationError(`Already credited a ${challenge.category} challenge for today`);
    }

    try {
      const created = await this.prisma.challengeDayEntry.create({
        data: {
          user_challenge_id: userChallengeId,
          day_number: dayNumber,
          date: new Date(),
          post_id: postId ?? undefined,
        },
      });

      await this.prisma.userChallenge.update({
        where: { id: userChallengeId },
        data: { days_completed: { increment: 1 } },
      });

      return created;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ValidationError('Day already credited');
      }
      throw err;
    }
  }

  /**
   * Finalize an active challenge attempt
   */
  async finalizeChallengeAttempt(userChallenge: any) {
    const uc = await this.prisma.userChallenge.findUnique({
      where: { id: userChallenge.id },
      include: { challenge: true, challenge_day_entries: true },
    });
    if (!uc) return null;

    const challenge = uc.challenge;
    const daysCompleted = uc.days_completed || 0;
    const totalDays =
      challenge.length === ChallengeLength.DAYS_7
        ? 7
        : challenge.length === ChallengeLength.DAYS_14
        ? 14
        : 21;

    const level = calculateBadgeLevel(daysCompleted, totalDays);

    if (level) {
      await this.prisma.badge.create({
        data: {
          user_id: uc.user_id,
          challenge_id: challenge.id,
          badge_level: level,
          earned_at: new Date(),
          days_completed: daysCompleted,
          user_challenge_id: uc.id,
        },
      });
    }

    await this.prisma.userChallenge.update({
      where: { id: uc.id },
      data: {
        status: ChallengeStatus.COMPLETED,
        completed_at: new Date(),
        badge_level: level ?? undefined,
      },
    });

    return { ucId: uc.id, badge_level: level, daysCompleted };
  }

  /**
   * Finalize all challenges whose end date has passed
   */
  async finalizeDueChallenges() {
    const now = new Date();
    const due = await this.prisma.userChallenge.findMany({
      where: { status: ChallengeStatus.ACTIVE, ends_at: { lte: now } },
    });

    const results = [];
    for (const u of due) {
      try {
        const r = await this.finalizeChallengeAttempt(u);
        results.push(r);
      } catch (e) {
        logger.error('Failed finalizing challenge', e);
      }
    }
    return results;
  }
}