-- DropForeignKey
ALTER TABLE "community_members" DROP CONSTRAINT "community_members_community_id_fkey";

-- DropForeignKey
ALTER TABLE "community_members" DROP CONSTRAINT "community_members_user_id_fkey";

-- AlterTable
ALTER TABLE "community_members" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
