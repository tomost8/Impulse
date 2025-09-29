import { BadgeLevel } from '../modules/common/types/enumTypes';
import { UserChallenge, Challenge, ChallengeProgress, UserChallengeHome, UserChallengeMy } from '../modules/challenge/schema/challengeTypes';

const badgeOrder: BadgeLevel[] = [BadgeLevel.BRONZE, BadgeLevel.SILVER, BadgeLevel.GOLD, BadgeLevel.DIAMOND];
const badgePctMap: Record<BadgeLevel, number> = {
  [BadgeLevel.BRONZE]: 4,
  [BadgeLevel.SILVER]: 5,
  [BadgeLevel.GOLD]: 6,
  [BadgeLevel.DIAMOND]: 7,
};

export function calculateBadgeLevel(daysCompleted: number, totalDays: number): BadgeLevel | null {
  const pct = (daysCompleted / totalDays) * 100;
  if (pct === 100) return BadgeLevel.DIAMOND;
  if (pct >= 85) return BadgeLevel.GOLD;
  if (pct >= 70) return BadgeLevel.SILVER;
  if (pct >= 50) return BadgeLevel.BRONZE;
  return null;
}

export function calculateChallengeProgress(uc: UserChallenge): {
  progress: ChallengeProgress;
  badgesEarned: BadgeLevel[];
} {
  const totalDays = uc.challenge.days;
  const daysCompleted = uc.days_completed;
  const daysRemaining = totalDays - daysCompleted;

  const nextBadge = badgeOrder.find(b => (badgePctMap[b] * totalDays) / 7 > daysCompleted);
  const daysUntilNextBadge = nextBadge ? Math.ceil((badgePctMap[nextBadge] * totalDays) / 7 - daysCompleted) : 0;

  const progress: ChallengeProgress = {
    daysRemaining,
    progressLabel: `${daysCompleted}/${totalDays}`,
    daysUntilNextBadge,
  };

  const badgesEarned = badgeOrder.filter(b => (badgePctMap[b] * totalDays) / 7 <= daysCompleted);

  return { progress, badgesEarned };
}

export function mapToUserChallengeHome(uc: UserChallenge): UserChallengeHome {
  const { progress, badgesEarned } = calculateChallengeProgress(uc);
  return { userChallenge: uc, progress, badgesEarned };
}

export function mapToUserChallengeMy(uc: UserChallenge): UserChallengeMy {
  const { progress, badgesEarned } = calculateChallengeProgress(uc);
  return {
    userChallenge: uc,
    progress,
    badgesEarned,
    friendsCompleted: [],
    pictures: [],
  };
}

export function getShortDescription(length: any): string {
  // Moved from resolver if needed
  return '';
}

export function mapChallengeToExplore(ch: Challenge, joinedIds: Set<number>, shortDescription?: string): any {
  // Already defined in queries; duplicated if needed for mutations
}

