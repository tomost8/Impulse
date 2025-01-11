/*
  Warnings:

  - You are about to drop the column `scheduled_date` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `activities` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "activities_scheduled_date_idx";

-- AlterTable
ALTER TABLE "activities" DROP COLUMN "scheduled_date",
DROP COLUMN "start_time",
ADD COLUMN     "scheduled_datetime" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "activities_scheduled_datetime_idx" ON "activities"("scheduled_datetime");
