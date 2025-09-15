-- CreateEnum
CREATE TYPE "public"."ChallengeLength" AS ENUM ('DAYS_7', 'DAYS_14', 'DAYS_21');

-- CreateEnum
CREATE TYPE "public"."BadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND');

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
    "status" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_category_length_key" ON "public"."Challenge"("category", "length");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_user_id_challenge_id_started_at_key" ON "public"."UserChallenge"("user_id", "challenge_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDayEntry_user_challenge_id_day_number_key" ON "public"."ChallengeDayEntry"("user_challenge_id", "day_number");

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
