/*
  Warnings:

  - You are about to drop the column `receiver_id` on the `friendships` table. All the data in the column will be lost.
  - You are about to drop the column `sender_id` on the `friendships` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,friend_id]` on the table `friendships` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `friend_id` to the `friendships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `friendships` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "friendships" DROP CONSTRAINT "friendships_sender_id_fkey";

-- DropIndex
DROP INDEX "friendships_sender_id_receiver_id_key";

-- AlterTable
ALTER TABLE "friendships" DROP COLUMN "receiver_id",
DROP COLUMN "sender_id",
ADD COLUMN     "friend_id" INTEGER NOT NULL,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "friendships_user_id_friend_id_key" ON "friendships"("user_id", "friend_id");

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
