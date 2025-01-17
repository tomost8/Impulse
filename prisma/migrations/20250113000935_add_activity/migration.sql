/*
  Warnings:

  - A unique constraint covering the columns `[post_id]` on the table `activities` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "activities_post_id_key" ON "activities"("post_id");
