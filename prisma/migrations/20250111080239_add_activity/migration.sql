/*
  Warnings:

  - Added the required column `userId` to the `activities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "activities_userId_scheduled_datetime_idx" ON "activities"("userId", "scheduled_datetime");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
