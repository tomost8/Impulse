import { Resolver, Mutation, Arg, Ctx, Int } from 'type-graphql';
import { ChallengeStatus } from '../../common/types/enumTypes';
import { ExploreChallengesResponse, ExploreChallenge } from '../schema/challengeTypes';
import { calculateBadgeLevel, mapChallengeToExplore } from '../utils/challengeUtils';

@Resolver()
export class ChallengeMutations {
  @Mutation(() => ExploreChallengesResponse)
  async joinChallenge(
    @Ctx() ctx: any,
    @Arg('challengeId', () => Int) challengeId: number
  ): Promise<ExploreChallengesResponse> {
    const userId = ctx.user.id;

    const existing = await ctx.prisma.userChallenge.findFirst({
      where: { user_id: userId, challenge_id: challengeId },
      include: { challenge: true },
    });

    if (existing) {
      return {
        success: true,
        challenges: [
          mapChallengeToExplore(existing.challenge, new Set([existing.challenge_id])),
        ],
      };
    }

    const now = new Date();
    const challenge = await ctx.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge)
      return { success: false, errors: [{ field: 'challengeId', message: 'Challenge not found' }] };

    const userChallenge = await ctx.prisma.userChallenge.create({
      data: {
        user_id: userId,
        challenge_id: challengeId,
        started_at: now,
        ends_at: new Date(now.getTime() + challenge.days * 24 * 60 * 60 * 1000),
        status: ChallengeStatus.ACTIVE,
        days_completed: 0,
        badge_level: 0,
      },
      include: { challenge: true },
    });

    return {
      success: true,
      challenges: [
        mapChallengeToExplore(userChallenge.challenge, new Set([userChallenge.challenge_id])),
      ],
    };
  }

  @Mutation(() => ExploreChallengesResponse)
  async completeChallenge(
    @Ctx() ctx: any,
    @Arg('challengeId', () => Int) challengeId: number
  ): Promise<ExploreChallengesResponse> {
    const userId = ctx.user.id;

    const userChallenge = await ctx.prisma.userChallenge.findFirst({
      where: { user_id: userId, challenge_id: challengeId },
      include: { challenge: true },
    });

    if (!userChallenge) {
      return { success: false, errors: [{ field: 'challengeId', message: 'Challenge not found' }] };
    }

    if (userChallenge.status === ChallengeStatus.COMPLETED) {
      return { success: true, challenges: [] };
    }

    const days_completed = userChallenge.days_completed;
    const total_days = userChallenge.challenge.days;

    const badgeLevel = calculateBadgeLevel(days_completed, total_days);

    const updated = await ctx.prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: {
        status: ChallengeStatus.COMPLETED,
        badge_level: badgeLevel,
      },
      include: { challenge: true },
    });

    return {
      success: true,
      challenges: [
        {
          challenge: updated.challenge,
          isJoined: true,
          isLocked: false,
          shortDescription: '',
        },
      ],
    };
  }

  @Mutation(() => ExploreChallengesResponse)
  async acknowledgeChallenge(
    @Ctx() ctx: any,
    @Arg('challengeId', () => Int) challengeId: number
  ): Promise<ExploreChallengesResponse> {
    const userId = ctx.user.id;

    const userChallenge = await ctx.prisma.userChallenge.findFirst({
      where: { user_id: userId, challenge_id: challengeId },
      include: { challenge: true },
    });

    if (!userChallenge) {
      return { success: false, errors: [{ field: 'challengeId', message: 'Challenge not found' }] };
    }

    const updated = await ctx.prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: { status: ChallengeStatus.COMPLETED }, // Assuming no ARCHIVED; fix if enum has it
      include: { challenge: true },
    });

    return {
      success: true,
      challenges: [
        {
          challenge: updated.challenge,
          isJoined: false,
          isLocked: false,
          shortDescription: '',
        },
      ],
    };
  }
}