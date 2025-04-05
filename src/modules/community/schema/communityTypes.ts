import { Field, ObjectType, Int } from 'type-graphql';

import { User } from '../../user/schema/userTypes';
import { Role, RequestStatus, Category } from '../../common/types/enumTypes';
import { FieldError } from '../../common/types/errorTypes';

/**
 * Community entity representing a community in the system
 * 
 * This class defines the structure of a community and is used both as a
 * GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const community: Community = {
 *   id: 1,
 *   name: "community name",
 *   description: "community description",
 *   thumbnail: "community thumbnail",
 *   influencer: User,
 *   influencer_id: 1,
 *   created_at: new Date(),
 *   updated_at: new Date()
 * };
 * ```
 */
@ObjectType()
export class Community {
  /** Unique identifier for the community */
  @Field(() => Int)
  id!: number;

  /** Community name */
  @Field(() => String)
  name!: string;

  /** Unique community code */
  @Field(() => String, { nullable: true })
  code!: string | null;

  /** Community description */
  @Field(() => String, { nullable: true })
  description!: string | null;

  /** Community thumbnail */
  @Field(() => String, { nullable: true })
  thumbnail!: string | null;

  /** Influencer leading the community */
  @Field(() => User)
  influencer!: User;

  /** User ID of influencer leading the community */
  @Field(() => Int)
  influencer_id!: number;

  /** Timestamp of when the community was created */
  @Field(() => Date)
  created_at!: Date;

  /** Timestamp of the last update to the community */
  @Field(() => Date)
  updated_at!: Date;
}

@ObjectType()
export class CommunityResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => Community, { nullable: true })
  community?: Community;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class CommunitiesResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Community], { nullable: true })
  communities?: Community[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 


/**
 * Community/User entity representing a Community/User member relation in the system
 * 
 * This class defines the structure of a Community/User member relation 
 * and is used both as a GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const community_member: CommunityMember = {
 *   id: 54,
 *   community: Community,
 *   community_id: 6,
 *   user: User,
 *   user_id: 20,
 *   role: "USER"
 *   status: "ACCEPTED"
 *   updatedAt: new Date()
 * };
 * ```
 */
@ObjectType()
export class CommunityMember {
  /** Unique identifier for the community/user relation */
  @Field(() => Int)
  id!: number;

  /** Community */
  @Field(() => Community)
  community!: Community;

  /** Community ID */
  @Field(() => Int)
  community_id!: number;

  /** User */
  @Field(() => User)
  user!: User;

  /** User ID */
  @Field(() => Int)
  user_id!: number;

  /** Role of user in community */
  @Field(() => Role)
  role!: Role;

  /** Status of user in community */
  @Field(() => RequestStatus)
  status!: RequestStatus;

  /** Timestamp of the when user joined community */
  @Field(() => Date)
  joined_at!: Date;
}


@ObjectType()
export class CommunityMemberResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => CommunityMember, { nullable: true })
  community_member?: CommunityMember;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class CommunityMembersResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [CommunityMember], { nullable: true })
  community_members?: CommunityMember[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 


/**
 * Community/Category entity representing a Community/Category relation in the system
 * 
 * This class defines the structure of a Community/Category member relation 
 * and is used both as a GraphQL type and a database model.
 * 
 * @remarks
 * All fields marked with `@Field` are exposed in the GraphQL schema
 * 
 * @example
 * ```typescript
 * const community_category: CommunityCategory = {
 *   id: 54,
 *   community: Community,
 *   community_id: 6,
 *   category: "WORKING_OUT"
 * };
 * ```
 */
@ObjectType()
export class CommunityCategory {
  /** Unique identifier for the community/category relation */
  @Field(() => Int)
  id!: number;

  /** Community */
  @Field(() => Community)
  community!: Community;

  /** Community ID */
  @Field(() => Int)
  community_id!: number;

  /** Category type of community */
  @Field(() => Category)
  category!: Category;
}


@ObjectType()
export class CommunityCategoryResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => CommunityCategory, { nullable: true })
  community_category?: CommunityCategory;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

@ObjectType()
export class CommunityCategoriesResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [CommunityCategory], { nullable: true })
  community_categories?: CommunityCategory[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
} 