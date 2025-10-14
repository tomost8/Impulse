-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('FOOD', 'WELLNESS', 'WORKING_OUT', 'STUDYING_WORKING', 'RISE_AND_SHINE', 'PASSION_HOBBY');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."UserSortType" AS ENUM ('POINTS_WEEKLY', 'POINTS_MONTHLY', 'POINTS_ALL');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('ADMIN_BROADCAST', 'COMMUNITY_NOTICE', 'GROUP_NOTICE', 'REMINDER');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "public"."NotificationScheduleType" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."ChallengeLength" AS ENUM ('DAYS_7', 'DAYS_14', 'DAYS_21');

-- CreateEnum
CREATE TYPE "public"."BadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND');

-- CreateEnum
CREATE TYPE "public"."ChallengeStatus" AS ENUM ('NOT_STARTED', 'ACTIVE', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "username" TEXT,
    "dob" DATE,
    "age" INTEGER,
    "gender" TEXT,
    "profile_picture" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "primary_goal" "public"."Category",
    "secondary_goal" "public"."Category",
    "timezone" TEXT,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "is_double_cam" BOOLEAN NOT NULL DEFAULT false,
    "fcm_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "referral_code" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."user_login_streaks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "last_login_date" TIMESTAMP(3) NOT NULL,
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "max_streak_count" INTEGER NOT NULL DEFAULT 0,
    "weekly_logins" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_login_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."friendships" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "friend_id" INTEGER NOT NULL,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "role" TEXT,
    "chat_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."communities" (
    "community_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "thumbnail" TEXT,
    "influencer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("community_id")
);

-- CreateTable
CREATE TABLE "public"."community_categories" (
    "id" SERIAL NOT NULL,
    "community_id" INTEGER NOT NULL,
    "category" "public"."Category" NOT NULL,

    CONSTRAINT "community_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."community_members" (
    "id" SERIAL NOT NULL,
    "community_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'ACCEPTED',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" INTEGER,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chats" (
    "chat_id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "password" TEXT,
    "profile_pic" TEXT,
    "creator_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("chat_id")
);

-- CreateTable
CREATE TABLE "public"."chat_members" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_message_id" INTEGER,
    "last_read_at" TIMESTAMP(3),

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "message_id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "content" TEXT,
    "post_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "public"."MessageReceipt" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'SENT',
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activities" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "duration" INTEGER,
    "scheduled_datetime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "post_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posts" (
    "id" SERIAL NOT NULL,
    "author_id" INTEGER NOT NULL,
    "caption" TEXT,
    "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "category" TEXT,
    "like_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_targets" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_views" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."points" (
    "user_id" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "spending_points" INTEGER NOT NULL DEFAULT 0,
    "weekly_points" INTEGER NOT NULL DEFAULT 0,
    "monthly_points" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "weekly_update_at" TIMESTAMP(3),
    "monthly_update_at" TIMESTAMP(3),

    CONSTRAINT "points_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."rewards" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "required_points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."redeems" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "reward_id" INTEGER NOT NULL,
    "points_spent" INTEGER NOT NULL,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDING',
    "payment_details" JSONB,
    "processing_time" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redeems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "community_id" INTEGER,
    "group_id" INTEGER,
    "schedule_type" "public"."NotificationScheduleType",
    "schedule_time" TIMESTAMP(3),
    "last_sent" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_recipients" (
    "id" SERIAL NOT NULL,
    "notification_id" INTEGER NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "status" "public"."NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "error_message" TEXT,

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Like" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "parent_comment_id" INTEGER,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Challenge" (
    "id" SERIAL NOT NULL,
    "category" "public"."Category" NOT NULL,
    "length" "public"."ChallengeLength" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points_bronze" INTEGER NOT NULL,
    "points_silver" INTEGER NOT NULL,
    "points_gold" INTEGER NOT NULL,
    "points_diamond" INTEGER NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserChallenge" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" "public"."ChallengeStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "days_completed" INTEGER NOT NULL,
    "badge_level" "public"."BadgeLevel",

    CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChallengeDayEntry" (
    "id" SERIAL NOT NULL,
    "user_challenge_id" INTEGER NOT NULL,
    "day_number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "post_id" INTEGER,

    CONSTRAINT "ChallengeDayEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Badge" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "badge_level" "public"."BadgeLevel" NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL,
    "days_completed" INTEGER NOT NULL,
    "user_challenge_id" INTEGER,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."referrals" (
    "id" SERIAL NOT NULL,
    "referrer_id" INTEGER NOT NULL,
    "referee_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "public"."users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "public"."users"("referral_code");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_login_streaks_user_id_key" ON "public"."user_login_streaks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_user_id_friend_id_key" ON "public"."friendships"("user_id", "friend_id");

-- CreateIndex
CREATE UNIQUE INDEX "communities_code_key" ON "public"."communities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "community_categories_community_id_category_key" ON "public"."community_categories"("community_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_community_id_user_id_key" ON "public"."community_members"("community_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_members_chat_id_user_id_key" ON "public"."chat_members"("chat_id", "user_id");

-- CreateIndex
CREATE INDEX "messages_chat_id_created_at_idx" ON "public"."messages"("chat_id", "created_at");

-- CreateIndex
CREATE INDEX "MessageReceipt_recipient_id_status_idx" ON "public"."MessageReceipt"("recipient_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReceipt_message_id_recipient_id_key" ON "public"."MessageReceipt"("message_id", "recipient_id");

-- CreateIndex
CREATE UNIQUE INDEX "activities_post_id_key" ON "public"."activities"("post_id");

-- CreateIndex
CREATE INDEX "activities_scheduled_datetime_idx" ON "public"."activities"("scheduled_datetime");

-- CreateIndex
CREATE INDEX "activities_user_id_scheduled_datetime_idx" ON "public"."activities"("user_id", "scheduled_datetime");

-- CreateIndex
CREATE INDEX "posts_author_id_created_at_idx" ON "public"."posts"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "posts_expires_at_is_deleted_idx" ON "public"."posts"("expires_at", "is_deleted");

-- CreateIndex
CREATE INDEX "posts_created_at_expires_at_idx" ON "public"."posts"("created_at", "expires_at");

-- CreateIndex
CREATE INDEX "post_targets_target_type_target_id_idx" ON "public"."post_targets"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_targets_post_id_target_type_target_id_key" ON "public"."post_targets"("post_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "post_views_user_id_viewed_at_idx" ON "public"."post_views"("user_id", "viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "post_views_post_id_user_id_key" ON "public"."post_views"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "points_user_id_key" ON "public"."points"("user_id");

-- CreateIndex
CREATE INDEX "notifications_sender_id_idx" ON "public"."notifications"("sender_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_schedule_time_is_active_idx" ON "public"."notifications"("schedule_time", "is_active");

-- CreateIndex
CREATE INDEX "notifications_community_id_idx" ON "public"."notifications"("community_id");

-- CreateIndex
CREATE INDEX "notifications_group_id_idx" ON "public"."notifications"("group_id");

-- CreateIndex
CREATE INDEX "notification_recipients_recipient_id_status_idx" ON "public"."notification_recipients"("recipient_id", "status");

-- CreateIndex
CREATE INDEX "notification_recipients_notification_id_status_idx" ON "public"."notification_recipients"("notification_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_notification_id_recipient_id_key" ON "public"."notification_recipients"("notification_id", "recipient_id");

-- CreateIndex
CREATE INDEX "Like_post_id_idx" ON "public"."Like"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "Like_post_id_user_id_key" ON "public"."Like"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "comments_post_id_created_at_idx" ON "public"."comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "public"."comments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_category_length_key" ON "public"."Challenge"("category", "length");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_user_id_challenge_id_started_at_key" ON "public"."UserChallenge"("user_id", "challenge_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDayEntry_user_challenge_id_day_number_key" ON "public"."ChallengeDayEntry"("user_challenge_id", "day_number");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referee_id_key" ON "public"."referrals"("referee_id");

-- AddForeignKey
ALTER TABLE "public"."user_login_streaks" ADD CONSTRAINT "user_login_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friendships" ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friendships" ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friendships" ADD CONSTRAINT "friendships_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("chat_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."communities" ADD CONSTRAINT "communities_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_categories" ADD CONSTRAINT "community_categories_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_members" ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_members" ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chats" ADD CONSTRAINT "chats_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReceipt" ADD CONSTRAINT "MessageReceipt_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReceipt" ADD CONSTRAINT "MessageReceipt_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_targets" ADD CONSTRAINT "post_targets_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_views" ADD CONSTRAINT "post_views_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_views" ADD CONSTRAINT "post_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."points" ADD CONSTRAINT "points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."redeems" ADD CONSTRAINT "redeems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."redeems" ADD CONSTRAINT "redeems_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_recipients" ADD CONSTRAINT "notification_recipients_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_recipients" ADD CONSTRAINT "notification_recipients_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserChallenge" ADD CONSTRAINT "UserChallenge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserChallenge" ADD CONSTRAINT "UserChallenge_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeDayEntry" ADD CONSTRAINT "ChallengeDayEntry_user_challenge_id_fkey" FOREIGN KEY ("user_challenge_id") REFERENCES "public"."UserChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeDayEntry" ADD CONSTRAINT "ChallengeDayEntry_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Badge" ADD CONSTRAINT "Badge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Badge" ADD CONSTRAINT "Badge_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Badge" ADD CONSTRAINT "Badge_user_challenge_id_fkey" FOREIGN KEY ("user_challenge_id") REFERENCES "public"."UserChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."referrals" ADD CONSTRAINT "referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
