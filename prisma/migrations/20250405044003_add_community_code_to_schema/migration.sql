/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `communities` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "communities" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "communities_code_key" ON "communities"("code");
