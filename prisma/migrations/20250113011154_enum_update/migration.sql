/*
  Warnings:

  - The `role` column on the `chat_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `chat_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `CommunityCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CommunityCategory" DROP CONSTRAINT "CommunityCategory_community_id_fkey";

-- AlterTable
ALTER TABLE "chat_members" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "CommunityCategory";

-- CreateTable
CREATE TABLE "community_categories" (
    "id" SERIAL NOT NULL,
    "community_id" INTEGER NOT NULL,
    "category" "Category" NOT NULL,

    CONSTRAINT "community_categories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "community_categories" ADD CONSTRAINT "community_categories_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("community_id") ON DELETE CASCADE ON UPDATE CASCADE;
