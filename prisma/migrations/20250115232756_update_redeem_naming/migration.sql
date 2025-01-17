/*
  Warnings:

  - The primary key for the `Redeem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `redeem_id` on the `Redeem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Redeem" DROP CONSTRAINT "Redeem_pkey",
DROP COLUMN "redeem_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Redeem_pkey" PRIMARY KEY ("id");
