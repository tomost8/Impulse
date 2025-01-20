/*
  Warnings:

  - The primary key for the `chats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `chats` table. All the data in the column will be lost.
  - The primary key for the `communities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `communities` table. All the data in the column will be lost.
  - The `role` column on the `community_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `community_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `conversation_id` on the `messages` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `chat_id` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
DROP TABLE "Category";

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FOOD', 'WELLNESS', 'WORKING_OUT', 'STUDYING_WORKING', 'RISE_AND_SHINE', 'PASSION_HOBBY');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "chat_members" DROP CONSTRAINT "chat_members_chat_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_members" DROP CONSTRAINT "chat_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "communities" DROP CONSTRAINT "communities_influencer_id_fkey";

-- DropForeignKey
ALTER TABLE "community_members" DROP CONSTRAINT "community_members_community_id_fkey";

-- DropForeignKey
ALTER TABLE "community_members" DROP CONSTRAINT "community_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "post_views" DROP CONSTRAINT "post_views_user_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_fkey";

-- DropIndex
DROP INDEX "messages_conversation_id_created_at_idx";

-- AlterTable
ALTER TABLE "chats" DROP CONSTRAINT "chats_pkey",
DROP COLUMN "id",
ADD COLUMN     "chat_id" SERIAL NOT NULL,
ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("chat_id");

-- AlterTable
ALTER TABLE "communities" DROP CONSTRAINT "communities_pkey",
DROP COLUMN "id",
ADD COLUMN     "community_id" SERIAL NOT NULL,
ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("community_id");

-- AlterTable
ALTER TABLE "community_members" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "conversation_id",
ADD COLUMN     "chat_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey" CASCADE,
DROP COLUMN "id",
ADD COLUMN     "user_id" SERIAL NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- CreateTable
CREATE TABLE "CommunityCategory" (
    "id" SERIAL NOT NULL,
    "community_id" INTEGER NOT NULL,
    "category" "Category" NOT NULL,

    CONSTRAINT "CommunityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_chat_id_created_at_idx" ON "messages"("chat_id", "created_at");

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityCategory" ADD CONSTRAINT "CommunityCategory_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("community_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
