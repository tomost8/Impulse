import { Field, ObjectType, Int, registerEnumType } from 'type-graphql';
import { FieldError } from '../../common/types/errorTypes';
import { User } from '../../user/schema/userTypes';
import { DateScalar } from '../../common/scalars/dateScalar';
import { NotificationType as PrismaNotificationType, NotificationStatus as PrismaNotificationStatus, NotificationScheduleType as PrismaNotificationScheduleType } from '@prisma/client';

// Use Prisma's generated enums
export { PrismaNotificationType as NotificationType };
export { PrismaNotificationStatus as NotificationStatus };
export { PrismaNotificationScheduleType as NotificationScheduleType };

// Register Prisma's enums with TypeGraphQL
registerEnumType(PrismaNotificationType, {
  name: 'NotificationType',
  description: 'Types of notifications in the system',
});

registerEnumType(PrismaNotificationStatus, {
  name: 'NotificationStatus',
  description: 'Status of a notification',
});

registerEnumType(PrismaNotificationScheduleType, {
  name: 'NotificationScheduleType',
  description: 'Schedule type for recurring notifications',
});

/**
 * Notification entity representing a notification in the system
 */
@ObjectType()
export class Notification {
  @Field(() => Int)
  id!: number;

  @Field(() => PrismaNotificationType)
  type!: PrismaNotificationType;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  content!: string;

  @Field(() => User)
  sender!: User;

  @Field(() => Int)
  sender_id!: number;

  @Field(() => Int, { nullable: true })
  community_id?: number | null;

  @Field(() => Int, { nullable: true })
  group_id?: number | null;

  @Field(() => String, { nullable: true })
  schedule_type?: string | null;

  @Field(() => DateScalar, { nullable: true })
  schedule_time?: Date | null;

  @Field(() => DateScalar, { nullable: true })
  last_sent?: Date | null;

  @Field(() => Boolean)
  is_active!: boolean;

  @Field(() => Date)
  created_at!: Date;

  @Field(() => Date)
  updated_at!: Date;

  @Field(() => [NotificationRecipient])
  recipients?: NotificationRecipient[];
}

/**
 * NotificationRecipient entity representing a recipient of a notification
 */
@ObjectType()
export class NotificationRecipient {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  notification_id!: number;

  @Field(() => Notification)
  notification!: Notification;

  @Field(() => Int)
  recipient_id!: number;

  @Field(() => User)
  recipient!: User;

  @Field(() => PrismaNotificationStatus)
  status!: PrismaNotificationStatus;

  @Field(() => DateScalar, { nullable: true })
  sent_at?: Date | null;

  @Field(() => DateScalar, { nullable: true })
  read_at?: Date | null;

  @Field(() => String, { nullable: true })
  error_message?: string | null;
}

/**
 * Response type for notification operations
 */
@ObjectType()
export class NotificationResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => Notification, { nullable: true })
  notification?: Notification | null;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

/**
 * Response type for notification list operations
 */
@ObjectType()
export class NotificationsResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Notification])
  notifications?: Notification[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

/**
 * Response type for paginated community notifications
 */
@ObjectType()
export class CommunityNotificationsResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [Notification])
  notifications!: Notification[];
  
  @Field(() => Int)
  totalCount!: number;
  
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

/**
 * Response type for notification recipient operations
 */
@ObjectType()
export class NotificationRecipientResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => NotificationRecipient, { nullable: true })
  recipient?: NotificationRecipient | null;

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

/**
 * Response type for notification recipient list operations
 */
@ObjectType()
export class NotificationRecipientsResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [NotificationRecipient])
  recipients!: NotificationRecipient[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}

/**
 * Subscription payload for real-time notification updates
 */
@ObjectType()
export class NotificationCreatedPayload {
  @Field(() => Notification)
  notification!: Notification;
} 