/*
  Warnings:

  - A unique constraint covering the columns `[community_id,user_id]` on the table `community_members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "community_members_community_id_user_id_key" ON "community_members"("community_id", "user_id");
