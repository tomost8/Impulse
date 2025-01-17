/*
  Warnings:

  - The primary key for the `Point` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Point" DROP CONSTRAINT "Point_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Point_pkey" PRIMARY KEY ("id");
