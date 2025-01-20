-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_creator_id_fkey";

-- AlterTable
ALTER TABLE "chats" ALTER COLUMN "creator_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
