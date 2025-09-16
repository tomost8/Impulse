import { BadgeLevel, ChallengeLength, PrismaClient } from '@prisma/client';
import { calculateBadgeLevel } from '../modules/challenge/utils/challengeUtils';

const prisma = new PrismaClient();

export async function getUserBadgeByCategory(userId: number) {
  const userChallenges = await prisma.userChallenge.findMany({
    where: { user_id: userId },
    include: { challenge: true },
  });

  const categoryMap: Record<string, any[]> = {};
  userChallenges.forEach(uc => {
    const cat = uc.challenge.category;
    if (!categoryMap[cat]) categoryMap[cat] = [];
    categoryMap[cat].push(uc);
  });

  return Object.entries(categoryMap).map(([category, challenges]) => {
    const badges = challenges.reduce(
      (acc, ch) => {
        const level = calculateBadgeLevel(ch.days_completed, 
          ch.challenge.length === ChallengeLength.DAYS_7 ? 7 :
          ch.challenge.length === ChallengeLength.DAYS_14 ? 14 : 21
        );
        if (level === BadgeLevel.BRONZE) acc.bronze = true;
        if (level === BadgeLevel.SILVER) acc.silver = true;
        if (level === BadgeLevel.GOLD) acc.gold = true;
        if (level === BadgeLevel.DIAMOND) acc.diamond = true;
        return acc;
      },
      { bronze: false, silver: false, gold: false, diamond: false }
    );

    return {
      category,
      totalChallenges: challenges.length,
      completedChallenges: challenges.filter(c => c.days_completed >= (c.challenge.length === ChallengeLength.DAYS_7 ? 7 : c.challenge.length === ChallengeLength.DAYS_14 ? 14 : 21)).length,
      badges,
    };
  });
}
