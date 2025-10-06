import { BadgeLevel, ChallengeLength } from '../../common/types/enumTypes';
import { ChallengeProgress, ExploreChallenge, UserChallengeHome, UserChallengeMy } from '../schema/challengeTypes';
import { ChallengeStatus } from '../../common/types/enumTypes';
import { UserChallenge, Challenge } from '../schema/challengeTypes';

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
  const totalDays = getDaysFromLength(uc.challenge.length);
  const daysCompleted = uc.days_completed;
  // const daysRemaining = totalDays - daysCompleted;
  const daysRemaining = Math.ceil((uc.ends_at.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) - 1;

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
  };
}

export function getShortDescription(length: ChallengeLength): string {
  switch (length) {
    case ChallengeLength.DAYS_7:
      return 'Max: 400 points';
    case ChallengeLength.DAYS_14:
      return 'Max: 800 points';
    case ChallengeLength.DAYS_21:
      return 'Max: 1200 points';
    default:
      return '';
  }
}

export function getDaysFromLength(length: ChallengeLength): number {
  switch (length) {
    case ChallengeLength.DAYS_7:
      return 7;
    case ChallengeLength.DAYS_14:
      return 14;
    case ChallengeLength.DAYS_21:
      return 21;
    default:
      return 7;
  }
}

export function mapChallengeToExplore(ch: Challenge, joinedIds: Set<number>, shortDescription?: string): ExploreChallenge {
  return {
    challenge: ch,
    isJoined: joinedIds.has(ch.id),
    isLocked: true,
    shortDescription: shortDescription || getShortDescription(ch.length),
  };
}

