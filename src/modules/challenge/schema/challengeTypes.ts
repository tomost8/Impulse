import { ObjectType, Field, Int, } from 'type-graphql';
import { FieldError } from '../../common/types/errorTypes';
import { Category, ChallengeLength, ChallengeStatus, BadgeLevel } from '../../common/types/enumTypes';
import { User } from '../../user/schema/userTypes';


@ObjectType()
export class Challenge {

  @Field(() => Int)
  id: number;

  @Field(() => Category)
  category: Category;
  
  @Field(() => String)
  title: string;

  @Field(() => String,  { nullable: true })
  description?: string | null;

  @Field(() => ChallengeLength)
  length: ChallengeLength;

  @Field(() => Int)
  points_bronze: number;

  @Field(() => Int)
  points_silver: number;

  @Field(() => Int)
  points_gold: number;

  @Field(() => Int)
  points_diamond: number;

}

@ObjectType()
export class UserChallenge {

  @Field(() => Int)
  id: number;

  @Field(() => User)
  user: User;

  @Field(() => Int)
  user_id!: number;

  @Field(() => Challenge)
  challenge: Challenge;

  @Field(() => Int)
  challenge_id!: number;

  @Field(() => Date)
  started_at: Date;

  @Field(() => Date)
  ends_at: Date;

  @Field(() => Date, { nullable: true })
  completed_at?: Date;

  @Field(() => ChallengeStatus)
  status: ChallengeStatus;

  @Field(() => Int)
  days_completed: number;

  @Field(() => BadgeLevel, { nullable: true })
  badge_level: BadgeLevel;
}

@ObjectType()
export class ChallengeProgress {
  @Field(() => Int)
  daysRemaining: number;

  @Field(() => String)
  progressLabel: string; // e.g. "2/7"

  @Field(() => Int)
  daysUntilNextBadge: number;
}

@ObjectType()
export class UserChallengeHome {
  @Field(() => UserChallenge)
  userChallenge: UserChallenge;

  @Field(() => ChallengeProgress)
  progress: ChallengeProgress;

  @Field(() => [BadgeLevel])
  badgesEarned: BadgeLevel[];
}

@ObjectType()
export class UserChallengeResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => [UserChallengeHome], { nullable: true })
  challenges?: UserChallengeHome[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class UserChallengeMy extends UserChallengeHome {
  @Field(() => [User], { nullable: true })
  friendsCompleted?: User[];
}

@ObjectType()
export class MyChallengesResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => [UserChallengeMy], { nullable: true })
  activeChallenges?: UserChallengeMy[];

  @Field(() => [UserChallengeMy], { nullable: true })
  completedChallenges?: UserChallengeMy[];

  @Field(() => [UserChallengeMy], { nullable: true })
  failedChallenges?: UserChallengeMy[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class ExploreChallenge {
  @Field(() => Challenge)
  challenge: Challenge;

  @Field(() => Boolean)
  isJoined: boolean;

  @Field(() => Boolean)
  isLocked: boolean;

  @Field(() => String)
  shortDescription: string; // "Max: 400 points" etc.
}

@ObjectType()
export class ExploreChallengesResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => [ExploreChallenge], { nullable: true })
  challenges?: ExploreChallenge[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class ExploreChallengeWithStatus extends ExploreChallenge {
  @Field(() => Int, { nullable: true })
  userChallengeId: number | null;

  @Field(() => String, { nullable: true })
  status: string;
}

@ObjectType()
export class ExploreChallengeWithStatusResponse {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => [ExploreChallengeWithStatus], { nullable: true })
  challenges?: ExploreChallengeWithStatus[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class ChallengeDayMedia {
  @Field(() => Int)
  day_number!: number;

  @Field(() => [String])
  mediaUrls!: string[];
}

@ObjectType()
export class ChallengeDayMediaResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [ChallengeDayMedia], { nullable: true })
  entries?: ChallengeDayMedia[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class FriendChallengeProgress {
  @Field(() => Int)
  id!: number;

  @Field(() => String, { nullable: true })
  username!: string | null;

  @Field(() => String, { nullable: true })
  first_name!: string | null;

  @Field(() => String, { nullable: true })
  last_name!: string | null;

  @Field(() => Int)
  days_completed!: number;

  @Field(() => ChallengeStatus)
  status!: ChallengeStatus;

  @Field(() => String, { nullable: true })
  profile_picture!: string | null;

  @Field(() => BadgeLevel, { nullable: true })
  badge_level!: BadgeLevel | null;
}
@ObjectType()
export class FriendsInChallengeResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [FriendChallengeProgress], { nullable: true })
  friends?: FriendChallengeProgress[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}
