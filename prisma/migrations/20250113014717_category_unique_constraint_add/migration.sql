/*
  Warnings:

  - A unique constraint covering the columns `[community_id,category]` on the table `community_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "community_categories_community_id_category_key" ON "community_categories"("community_id", "category");
