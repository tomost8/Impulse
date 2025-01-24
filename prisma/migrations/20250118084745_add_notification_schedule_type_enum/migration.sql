/*
  Warnings:

  - The `schedule_type` column on the `notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "NotificationScheduleType" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "schedule_type",
ADD COLUMN     "schedule_type" "NotificationScheduleType";
