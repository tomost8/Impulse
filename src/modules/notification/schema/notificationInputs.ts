import { Field, InputType, Int } from 'type-graphql';
import { IsString, IsInt, IsOptional, IsEnum, IsBoolean, IsDate, MinLength, MaxLength } from 'class-validator';
import { NotificationStatus, NotificationType } from './notificationTypes';

/**
 * Input type for creating a new notification
 */
@InputType()
export class CreateNotificationInput {
  @Field(() => NotificationType)
  @IsEnum(NotificationType)
  type!: NotificationType;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @Field(() => Int, { nullable: true})
  @IsInt()
  sender_id?: number | null;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  community_id?: number | null;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  group_id?: number | null;

  @Field(() => String, { nullable: true })
  @IsEnum(['once', 'daily', 'weekly', 'monthly'])
  @IsOptional()
  schedule_type?: 'once' | 'daily' | 'weekly' | 'monthly' | null;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  schedule_time?: Date | null;

  @Field(() => [Int], { nullable: true })
  @IsInt({ each: true })
  @IsOptional()
  recipient_ids?: number[] | null;
}

/**
 * Input type for updating an existing notification
 */
@InputType()
export class UpdateNotificationInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(100)
  title?: string | null;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(1000)
  content?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean | null;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  schedule_time?: Date | null;
}

/**
 * Input type for filtering notifications
 */
@InputType()
export class NotificationFilterInput {
  @Field(() => NotificationType, { nullable: true })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType | null  ;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  sender_id?: number | null;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  recipient_id?: number | null;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  community_id?: number | null;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  group_id?: number | null;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  unread_only?: boolean | null;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  skip?: number | null;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  take?: number | null;
}

/**
 * Input type for updating the status of a notification recipient
 */
@InputType()
export class NotificationRecipientUpdateInput {
  @Field(() => NotificationStatus)
  @IsEnum(NotificationStatus)
  status!: NotificationStatus;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  error_message?: string | null;
}

/**
 * Input type for marking notifications as read
 */
@InputType()
export class MarkNotificationsReadInput {
  @Field(() => [Int])
  @IsInt({ each: true })
  notification_ids!: number[];

  @Field(() => Int)
  @IsInt()
  recipient_id!: number;
} 