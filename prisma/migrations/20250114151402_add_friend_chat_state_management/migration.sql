-- AlterTable
ALTER TABLE "friendships" ADD COLUMN     "chat_id" INTEGER;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE SET NULL ON UPDATE CASCADE;
