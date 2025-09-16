import { Resolver, Query, Arg, Ctx, Int } from 'type-graphql';
import { ChallengeStatus, Category } from '../../common/types/enumTypes';
import { ExploreChallengesResponse, ExploreChallenge, UserChallengeResponse, MyChallengesResponse, UserChallengeHome, UserChallengeMy, Challenge } from '../schema/challengeTypes';
import { mapChallengeToExplore, mapToUserChallengeHome, mapToUserChallengeMy } from '../utils/challengeUtils';

@Resolver()
export class ChallengeQueries {
  @Query(() => ExploreChallengesResponse)
  async getExploreChallenges(
    @Ctx() ctx: any,
    @Arg('category', () => Category, { nullable: true }) category?: Category
  ): Promise<ExploreChallengesResponse> {
    const userId = ctx.user.id;

    const allChallenges = await ctx.prisma.challenge.findMany({
      where: category ? { category } : {},
      take: 3,
    });

    const joinedChallenges = await ctx.prisma.userChallenge.findMany({
      where: { user_id: userId },
      select: { challenge_id: true },
    });
    const joinedIds = new Set<number>(joinedChallenges.map((j: any) => j.challenge_id));

    const challenges: ExploreChallenge[] = allChallenges.map((ch: Challenge) =>
      mapChallengeToExplore(ch, joinedIds)
    );

    return { success: true, challenges };
  }

  @Query(() => ExploreChallengesResponse)
  async getChallengeInfo(
    @Ctx() ctx: any,
    @Arg('challengeId', () => Int) challengeId: number
  ): Promise<ExploreChallengesResponse> {
    const userId = ctx.user.id;

    const challenge = await ctx.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge)
      return { success: false, errors: [{ field: 'challengeId', message: 'Challenge not found' }] };

    const userChallenge = await ctx.prisma.userChallenge.findFirst({
      where: { user_id: userId, challenge_id: challengeId },
    });

    return {
      success: true,
      challenges: [
        mapChallengeToExplore(challenge, new Set(userChallenge ? [challenge.id] : [])),
      ],
    };
  }

  @Query(() => ExploreChallengesResponse)
  async getCompletedChallenges(@Ctx() ctx: any): Promise<ExploreChallengesResponse> {
    const userId = ctx.user.id;

    const completed = await ctx.prisma.userChallenge.findMany({
      where: { user_id: userId, status: ChallengeStatus.COMPLETED },
      include: { challenge: true },
    });

    const challenges: ExploreChallenge[] = completed.map((uc: any) => ({
      challenge: uc.challenge,
      isJoined: true,
      isLocked: false,
      shortDescription: '',
    }));

    return { success: true, challenges };
  }

  @Query(() => UserChallengeResponse)
  async getHomePage(@Ctx() ctx: any): Promise<UserChallengeResponse> {
    const userId = ctx.user.id;

    const userChallenges: any[] = await ctx.prisma.userChallenge.findMany({
      where: { user_id: userId, status: ChallengeStatus.ACTIVE },
      include: { challenge: true },
    });

    if (!userChallenges.length) return { success: true, challenges: [] };

    const challenges: UserChallengeHome[] = userChallenges.map(mapToUserChallengeHome);

    return { success: true, challenges };
  }

  @Query(() => MyChallengesResponse)
  async getMyChallenges(@Ctx() ctx: any): Promise<MyChallengesResponse> {
    const userId = ctx.user.id;

    const userChallenges: any[] = await ctx.prisma.userChallenge.findMany({
      where: { user_id: userId },
      include: { challenge: true, user: true },
    });

    if (!userChallenges.length) return { success: true, activeChallenges: [], completedChallenges: [] };

    const activeChallenges: UserChallengeMy[] = [];
    const completedChallenges: UserChallengeMy[] = [];

    for (const uc of userChallenges) {
      const myChallenge = mapToUserChallengeMy(uc);

      if (uc.status === ChallengeStatus.ACTIVE) activeChallenges.push(myChallenge);
      else if (uc.status === ChallengeStatus.COMPLETED) completedChallenges.push(myChallenge);
    }

    return { success: true, activeChallenges, completedChallenges };
  }
}