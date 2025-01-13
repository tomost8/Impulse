/*
  Warnings:

  - You are about to drop the column `media_urls` on the `posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "posts" DROP COLUMN "media_urls",
ADD COLUMN     "media_url" TEXT;
