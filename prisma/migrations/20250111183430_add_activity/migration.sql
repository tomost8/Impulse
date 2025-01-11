/*
  Warnings:

  - You are about to drop the column `userId` on the `activities` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `activities` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "activities" DROP CONSTRAINT "activities_userId_fkey";

-- DropIndex
DROP INDEX "activities_userId_scheduled_datetime_idx";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "userId",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "activities_user_id_scheduled_datetime_idx" ON "activities"("user_id", "scheduled_datetime");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
