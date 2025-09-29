import { Resolver, Query, Arg, Ctx, Int, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import { ChallengeStatus, Category } from '../../common/types/enumTypes';
import { ExploreChallengesResponse, ExploreChallenge, UserChallengeResponse, MyChallengesResponse, UserChallengeHome, UserChallengeMy, Challenge, ExploreChallengeWithStatus, ExploreChallengeWithStatusResponse, ChallengeDayMediaResponse, FriendsInChallengeResponse } from '../schema/challengeTypes';
import { mapChallengeToExplore, mapToUserChallengeHome, mapToUserChallengeMy } from '../utils/challengeUtils';
import { ChallengeService } from '../../../services/challengeService';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { UsersResponse } from '../../user/schema/userTypes';

@Service()
@Resolver()
export class ChallengeQueries {
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
  @Query(() => ExploreChallengeWithStatusResponse)
  @UseMiddleware(authMiddleware)
  async getExploreChallenges(
    @Ctx() ctx: any,
    @Arg('category', () => Category, { nullable: true }) category?: Category
  ): Promise<ExploreChallengeWithStatusResponse> {
    try {
      const userId = await this.getUserIdFromContext(ctx);

    const allChallenges = await this.challengeService.prisma.challenge.findMany({
      where: category ? { category } : {},
    });

    const joinedChallenges = await this.challengeService.prisma.userChallenge.findMany({
      where: { user_id: userId },
      select: { id: true, challenge_id: true, status: true },
    });

    const joinedStatusMap = new Map<
      number,
      { id: number; status: string }
    >(
      joinedChallenges.map((j) => [j.challenge_id, { id: j.id, status: j.status }])
    );

    console.log("🎯 ChallengeQueries getExploreChallenges joinedChallenges: ", joinedChallenges);
    console.log("🎯 ChallengeQueries getExploreChallenges joinedStatusMap: ", joinedStatusMap);

    const challenges: ExploreChallengeWithStatus[] = allChallenges.map((ch: Challenge) => {
      const base = mapChallengeToExplore(ch, new Set(joinedStatusMap.keys()));

      // console.log("getExploreChallenges challenges base", base);
      
      const joinedEntry = joinedStatusMap.get(ch.id);
      const status = joinedEntry?.status ?? "";
      const userChallengeId = joinedEntry?.id ?? null;

      if (status !== ChallengeStatus.ACTIVE && status !== ChallengeStatus.COMPLETED) {
        const sameCategory = allChallenges.filter((c) => c.category === ch.category);
        
        const sameCategoryStatuses = sameCategory.map(
          (c) => joinedStatusMap.get(c.id) || ""
        );

        const hasActive = sameCategory.some(
          (c) => joinedStatusMap.get(c.id)?.status === ChallengeStatus.ACTIVE
        );

        if (!hasActive) {
          if (ch.id % 3 === 1) {
            base.isLocked = false;
          } else {
            const prev = sameCategory.find((c) => c.id === ch.id - 1);
            if (prev) {
              const prevStatus = joinedStatusMap.get(prev.id)?.status ?? "";
              if (prevStatus === ChallengeStatus.COMPLETED) {
                base.isLocked = false;
              }
            }
          }
        }
      }

      return {
        ...base,
        status,
        userChallengeId,
      };
    });

    console.log('🪜 Explore Challenges:', challenges);

    return { success: true, challenges };
    } catch (error) {
      return { success: false, errors: [{ field: 'auth', message: error instanceof Error ? error.message : 'Authentication failed' }] };
    }
  }

  @Query(() => ExploreChallengesResponse)
  @UseMiddleware(authMiddleware)
  async getChallengeInfo(
    @Ctx() ctx: any,
    @Arg('challengeId', () => Int) challengeId: number
  ): Promise<ExploreChallengesResponse> {
    try {
      const userId = await this.getUserIdFromContext(ctx);

    const challenge = await this.challengeService.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge)
      return { success: false, errors: [{ field: 'challengeId', message: 'Challenge not found' }] };

    const userChallenge = await this.challengeService.prisma.userChallenge.findFirst({
      where: { user_id: userId, challenge_id: challengeId },
    });

    return {
      success: true,
      challenges: [
        mapChallengeToExplore(challenge, new Set(userChallenge ? [challenge.id] : [])),
      ],
    };
    } catch (error) {
      return { success: false, errors: [{ field: 'auth', message: error instanceof Error ? error.message : 'Authentication failed' }] };
    }
  }

  @Query(() => ExploreChallengesResponse)
  @UseMiddleware(authMiddleware)
  async getCompletedChallenges(@Ctx() ctx: any): Promise<ExploreChallengesResponse> {
    try {
      const userId = await this.getUserIdFromContext(ctx);

    const completed = await this.challengeService.prisma.userChallenge.findMany({
      where: { user_id: userId, status: ChallengeStatus.COMPLETED },
      include: { challenge: true },
    });

    const challenges: ExploreChallenge[] = completed.map((uc: any) => ({
      challenge: uc.challenge,
      isJoined: true,
      isLocked: true,
      shortDescription: '',
    }));

    return { success: true, challenges };
    } catch (error) {
      return { success: false, errors: [{ field: 'auth', message: error instanceof Error ? error.message : 'Authentication failed' }] };
    }
  }

  @Query(() => UserChallengeResponse)
  @UseMiddleware(authMiddleware)
  async getActiveChallenges(@Ctx() ctx: any): Promise<UserChallengeResponse> {
    try {
      const userId = await this.getUserIdFromContext(ctx);

    const userChallenges: any[] = await this.challengeService.prisma.userChallenge.findMany({
      where: { user_id: userId, status: ChallengeStatus.ACTIVE },
      include: { challenge: true },
    });

    if (!userChallenges.length) return { success: true, challenges: [] };

    const challenges: UserChallengeHome[] = userChallenges.map(mapToUserChallengeHome);

    return { success: true, challenges };
    } catch (error) {
      return { success: false, errors: [{ field: 'auth', message: error instanceof Error ? error.message : 'Authentication failed' }] };
    }
  }

  @Query(() => MyChallengesResponse)
  @UseMiddleware(authMiddleware)
  async getUserChallenges(@Ctx() ctx: any): Promise<MyChallengesResponse> {
    try {
      const userId = await this.getUserIdFromContext(ctx);

    const userChallenges: any[] = await this.challengeService.prisma.userChallenge.findMany({
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
    } catch (error) {
      return { success: false, errors: [{ field: 'auth', message: error instanceof Error ? error.message : 'Authentication failed' }] };
    }
  }

  @Query(() => ChallengeDayMediaResponse)
  @UseMiddleware(authMiddleware)
  async getChallengeDayMedia(
    @Ctx() ctx: any,
    @Arg("userChallengeId", () => Int) userChallengeId: number
  ): Promise<ChallengeDayMediaResponse> {
    try {
      const userId = await this.getUserIdFromContext(ctx);
      const entries = await this.challengeService.getDayEntriesWithMedia(userChallengeId, userId);
      return { success: true, entries };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            field: "userChallengeId",
            message: error instanceof Error ? error.message : "Failed to fetch challenge day media",
          },
        ],
      };
    }
  }

  @Query(() => FriendsInChallengeResponse)
  @UseMiddleware(authMiddleware)
  async getFriendsInChallenge(
    @Ctx() ctx: any,
    @Arg("challengeId", () => Int) challengeId: number,
    @Arg("status", () => ChallengeStatus) status: ChallengeStatus
  ): Promise<FriendsInChallengeResponse> {
    try {
      const userId = await this.getUserIdFromContext(ctx);

      const friends = await this.challengeService.getFriendsInChallenge(userId, challengeId, status);

      return { success: true, friends };
    } catch (error) {
      return {
        success: false,
        friends: [],
        errors: [
          { field: "challenge", message: error instanceof Error ? error.message : "Failed to fetch friends in challenge" }
        ]
      };
    }
  }

}