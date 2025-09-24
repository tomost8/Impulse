import { Resolver, Mutation, Arg, Ctx, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { ChallengeStatus, ChallengeLength } from '../../common/types/enumTypes';
import { ExploreChallengesResponse, ExploreChallenge } from '../schema/challengeTypes';
import { calculateBadgeLevel, mapChallengeToExplore, getDaysFromLength } from '../utils/challengeUtils';
import { ChallengeService } from '../../../services/challengeService';
import { authMiddleware } from '../../../middleware/authMiddleware';

@Service()
@Resolver()
export class ChallengeMutations {
  constructor(private challengeService: ChallengeService) {}

  private async getUserIdFromContext(ctx: any): Promise<number> {
    const user = await this.challengeService.prisma.user.findUnique({
      where: { firebase_uid: ctx.user.uid }
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user.id;
  }

@Mutation(() => ExploreChallengesResponse)
@UseMiddleware(authMiddleware)
async joinChallenge(
  @Ctx() ctx: any,
  @Arg('challengeId', () => Int) challengeId: number,
  @Arg('deviceLocalOffsetMinutes', () => Int, { defaultValue: 0 }) deviceLocalOffsetMinutes: number
): Promise<ExploreChallengesResponse> {
  try {
    const userId = await this.getUserIdFromContext(ctx);

    const userChallenge = await this.challengeService.joinChallenge(
      userId,
      challengeId,
      deviceLocalOffsetMinutes
    );

    return {
      success: true,
      challenges: [
        mapChallengeToExplore(userChallenge.challenge as any, new Set([userChallenge.challenge_id])),
      ],
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: 'challengeId',
          message: error instanceof Error ? error.message : 'Failed to join challenge',
        },
      ],
    };
  }
}

  @Mutation(() => ExploreChallengesResponse)
  @UseMiddleware(authMiddleware)
  async completeChallenge(
    @Ctx() ctx: any,
    @Arg('challengeId', () => Int) challengeId: number
  ): Promise<ExploreChallengesResponse> {
    try {
      const userId = await this.getUserIdFromContext(ctx);

      const userChallenge = await this.challengeService.prisma.userChallenge.findFirst({
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
      const total_days = getDaysFromLength(userChallenge.challenge.length);

      const badgeLevel = calculateBadgeLevel(days_completed, total_days);

      const updated = await this.challengeService.prisma.userChallenge.update({
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
            challenge: updated.challenge as any,
            isJoined: true,
            isLocked: false,
            shortDescription: '',
          },
        ],
      };
    } catch (error) {
      return { success: false, errors: [{ field: 'auth', message: error instanceof Error ? error.message : 'Authentication failed' }] };
    }
  }

  @Mutation(() => ExploreChallengesResponse)
  @UseMiddleware(authMiddleware)
  async acknowledgeChallenge(
    @Ctx() ctx: any,
    @Arg('challengeId', () => Int) challengeId: number
  ): Promise<ExploreChallengesResponse> {
    try {
      const userId = await this.getUserIdFromContext(ctx);

      const userChallenge = await this.challengeService.prisma.userChallenge.findFirst({
        where: { user_id: userId, challenge_id: challengeId },
        include: { challenge: true },
      });

      if (!userChallenge) {
        return { success: false, errors: [{ field: 'challengeId', message: 'Challenge not found' }] };
      }

      const updated = await this.challengeService.prisma.userChallenge.update({
        where: { id: userChallenge.id },
        data: { status: ChallengeStatus.COMPLETED }, // Assuming no ARCHIVED; fix if enum has it
        include: { challenge: true },
      });

      return {
        success: true,
        challenges: [
          {
            challenge: updated.challenge as any,
            isJoined: false,
            isLocked: false,
            shortDescription: '',
          },
        ],
      };
    } catch (error) {
      return { success: false, errors: [{ field: 'auth', message: error instanceof Error ? error.message : 'Authentication failed' }] };
    }
  }
}