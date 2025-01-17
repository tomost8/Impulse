/*
  Warnings:

  - You are about to drop the column `points_spent` on the `points` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "points" DROP COLUMN "points_spent",
ADD COLUMN     "spending_points" INTEGER NOT NULL DEFAULT 0;
