/*
  Warnings:

  - The primary key for the `Point` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Point` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `Point` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Point" DROP CONSTRAINT "Point_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Point_pkey" PRIMARY KEY ("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Point_user_id_key" ON "Point"("user_id");
