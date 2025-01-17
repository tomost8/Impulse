/*
  Warnings:

  - The primary key for the `Point` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Point` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Point" DROP CONSTRAINT "Point_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Point_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "Reward" ALTER COLUMN "title" SET DATA TYPE TEXT;
